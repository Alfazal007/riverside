import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface VideoFile {
    id: string;
    timestamp: number;
    filename: string;
    fullPath: string;
}

interface VideoInfo {
    duration: number;
    width: number;
    height: number;
}

interface SyncedVideo extends VideoFile {
    info: VideoInfo;
    startDelay: number;
    endTime: number;
}

/**
 * Parse filename to extract ID and timestamp
 */
function parseVideoFilename(filename: string): VideoFile | null {
    const match = filename.match(/^(\d+)_(\d+)\.mp4$/);
    if (!match) return null;

    const [, id, timestampStr] = match;
    const timestamp = parseInt(timestampStr as string);

    return {
        id: id as string,
        timestamp,
        filename,
        fullPath: path.resolve(filename)
    };
}

/**
 * Get video information using ffprobe
 */
async function getVideoInfo(filePath: string): Promise<VideoInfo> {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;

    try {
        const { stdout } = await execAsync(command);
        const data = JSON.parse(stdout);

        const videoStream = data.streams.find((stream: any) => stream.codec_type === 'video');
        if (!videoStream) {
            throw new Error(`No video stream found in ${filePath}`);
        }

        return {
            duration: parseFloat(data.format.duration),
            width: parseInt(videoStream.width),
            height: parseInt(videoStream.height)
        };
    } catch (error) {
        throw new Error(`Failed to get video info for ${filePath}: ${error}`);
    }
}

/**
 * Find video files in directory and parse them
 */
async function findVideoFiles(directory: string = '.'): Promise<VideoFile[]> {
    const files = await fs.promises.readdir(directory);
    const videoFiles: VideoFile[] = [];

    for (const file of files) {
        const parsed = parseVideoFilename(file);
        if (parsed) {
            parsed.fullPath = path.join(directory, file);
            videoFiles.push(parsed);
        }
    }

    // Sort by timestamp
    return videoFiles.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calculate synchronization timing for all videos
 */
async function calculateSyncTiming(videoFiles: VideoFile[]): Promise<SyncedVideo[]> {
    const syncedVideos: SyncedVideo[] = [];

    // Add buffer to account for timestamp inaccuracy (seconds before actual timestamp)
    const SYNC_BUFFER = 0; // seconds

    // Get video info for all files
    for (const video of videoFiles) {
        console.log(`Getting info for ${video.filename}...`);
        const info = await getVideoInfo(video.fullPath);

        // Calculate start delay: each video should start SYNC_BUFFER seconds before its timestamp
        // This means we subtract SYNC_BUFFER from the relative timing
        const baseTimestamp = videoFiles[0]?.timestamp as number;
        const relativeTimestamp = video.timestamp - baseTimestamp; // Milliseconds from first video
        const startDelay = Math.max(0, (relativeTimestamp / 1000) + SYNC_BUFFER); // Convert to seconds and subtract buffer
        const endTime = startDelay + info.duration;

        syncedVideos.push({
            ...video,
            info,
            startDelay,
            endTime
        });

        console.log(`  ${video.filename}: original delay ${relativeTimestamp / 1000}s, adjusted delay ${startDelay}s (buffer: -${SYNC_BUFFER}s)`);
    }

    return syncedVideos;
}

/**
 * Calculate optimal grid layout for videos
 */
function calculateGridLayout(videoCount: number): { cols: number; rows: number } {
    if (videoCount === 1) return { cols: 1, rows: 1 };
    if (videoCount === 2) return { cols: 2, rows: 1 };
    if (videoCount <= 4) return { cols: 2, rows: 2 };
    if (videoCount <= 6) return { cols: 3, rows: 2 };
    if (videoCount <= 9) return { cols: 3, rows: 3 };

    // For more videos, calculate square-ish grid
    const cols = Math.ceil(Math.sqrt(videoCount));
    const rows = Math.ceil(videoCount / cols);
    return { cols, rows };
}

/**
 * Generate FFmpeg filter complex for video combination
 */
function generateVideoFilter(syncedVideos: SyncedVideo[]): string {
    const { cols, rows } = calculateGridLayout(syncedVideos.length);
    const cellWidth = Math.floor(1280 / cols);
    const cellHeight = Math.floor(720 / rows);

    // Calculate total duration to know when to add black frames
    const totalDuration = Math.max(...syncedVideos.map(v => v.endTime));

    let filter = '';

    // Process each video with proper timing
    syncedVideos.forEach((video, index) => {
        const videoEndTime = video.startDelay + video.info.duration;
        const blackAfterDuration = totalDuration - videoEndTime;

        // Scale the video first
        filter += `[${index}:v]scale=${cellWidth}:${cellHeight}:force_original_aspect_ratio=decrease,pad=${cellWidth}:${cellHeight}:(ow-iw)/2:(oh-ih)/2:color=black[scaled${index}]; `;

        let videoChain = `[scaled${index}]`;

        // Add black padding at start if delayed
        if (video.startDelay > 0) {
            filter += `color=black:size=${cellWidth}x${cellHeight}:duration=${video.startDelay}[blackstart${index}]; `;
            filter += `[blackstart${index}][scaled${index}]concat=n=2:v=1:a=0[withstart${index}]; `;
            videoChain = `[withstart${index}]`;
        }

        // Add black padding at end if video ends before total duration
        if (blackAfterDuration > 0.01) { // Small threshold to avoid floating point issues
            filter += `color=black:size=${cellWidth}x${cellHeight}:duration=${blackAfterDuration}[blackend${index}]; `;
            filter += `${videoChain}[blackend${index}]concat=n=2:v=1:a=0[v${index}]; `;
        } else {
            // If no black padding needed at end, just rename the chain
            filter += `${videoChain}null[v${index}]; `;
        }
    });

    // Create grid layout
    if (syncedVideos.length === 1) {
        filter += `[v0]scale=1280:720[vout]`;
    } else if (syncedVideos.length === 2) {
        filter += `[v0][v1]hstack=inputs=2[vout]`;
    } else {
        // For more complex grids, use xstack
        const inputs = syncedVideos.map((_, i) => `[v${i}]`).join('');
        const layout = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const index = row * cols + col;
                if (index < syncedVideos.length) {
                    layout.push(`${col * cellWidth}_${row * cellHeight}`);
                }
            }
        }
        filter += `${inputs}xstack=inputs=${syncedVideos.length}:layout=${layout.join('|')}:fill=black[vout]`;
    }

    return filter;
}

/**
 * Generate FFmpeg filter for audio mixing
 */
function generateAudioFilter(syncedVideos: SyncedVideo[]): string {
    let filter = '';

    // Calculate total duration for audio padding
    const totalDuration = Math.max(...syncedVideos.map(v => v.endTime));

    // Process audio tracks with proper timing
    syncedVideos.forEach((video, index) => {
        const delayMs = Math.round(video.startDelay * 1000);
        const audioEndTime = video.startDelay + video.info.duration;
        const silenceAfter = totalDuration - audioEndTime;

        // Resample audio first
        filter += `[${index}:a]aresample=48000[resampled${index}]; `;

        let audioChain = `[resampled${index}]`;

        // Add silence at start if delayed
        if (delayMs > 0) {
            filter += `aevalsrc=0:sample_rate=48000:duration=${video.startDelay}[silencestart${index}]; `;
            filter += `[silencestart${index}][resampled${index}]concat=v=0:a=1[withstart${index}]; `;
            audioChain = `[withstart${index}]`;
        }

        // Add silence at end if audio ends before total duration
        if (silenceAfter > 0.01) {
            filter += `aevalsrc=0:sample_rate=48000:duration=${silenceAfter}[silenceend${index}]; `;
            filter += `${audioChain}[silenceend${index}]concat=v=0:a=1[a${index}]; `;
        } else {
            // If no silence padding needed at end, just rename the chain
            filter += `${audioChain}anull[a${index}]; `;
        }
    });

    // Mix all audio tracks
    const audioInputs = syncedVideos.map((_, i) => `[a${i}]`).join('');
    filter += `${audioInputs}amix=inputs=${syncedVideos.length}:duration=longest:normalize=0[aout]`;

    return filter;
}

/**
 * Execute FFmpeg command with logging
 */
async function executeFFmpeg(command: string): Promise<void> {
    console.log('\n=== FFmpeg Command ===');
    console.log(command);
    console.log('\n=== FFmpeg Output ===');

    return new Promise((resolve, reject) => {
        const process = exec(command);

        process.stdout?.on('data', (data) => {
            console.log(data.toString());
        });

        process.stderr?.on('data', (data) => {
            console.log(data.toString());
        });

        process.on('close', (code) => {
            if (code === 0) {
                console.log('\n=== FFmpeg Completed Successfully ===');
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        process.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Main function to combine videos
 */
async function combineVideos(): Promise<void> {
    try {
        let outputFilename = path.join(__dirname, "../downloads/combined_output.mp4")
        console.log('Finding video files...');
        const videoFiles = await findVideoFiles(path.join(__dirname, "../downloads/"));

        if (videoFiles.length === 0) {
            throw new Error('No valid video files found');
        }

        console.log(`Found ${videoFiles.length} video files:`);
        videoFiles.forEach(v => console.log(`  - ${v.filename} (timestamp: ${v.timestamp})`));

        console.log('\nCalculating synchronization with 2-second buffer...');
        const syncedVideos = await calculateSyncTiming(videoFiles);

        // Display sync info
        console.log('\nSynchronization details:');
        syncedVideos.forEach(v => {
            console.log(`  - ${v.filename}: starts at ${v.startDelay.toFixed(3)}s, ends at ${v.endTime.toFixed(3)}s`);
        });

        // Calculate total duration
        const totalDuration = Math.max(...syncedVideos.map(v => v.endTime));
        console.log(`Total duration: ${totalDuration.toFixed(3)} seconds`);

        // Generate filters
        const videoFilter = generateVideoFilter(syncedVideos);
        const audioFilter = generateAudioFilter(syncedVideos);
        const combinedFilter = videoFilter + '; ' + audioFilter;

        // Build FFmpeg command
        const inputs = syncedVideos.map(v => `-i "${v.fullPath}"`).join(' ');
        const command = `ffmpeg ${inputs} \\
  -filter_complex "${combinedFilter}" \\
  -map "[vout]" -map "[aout]" \\
  -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p \\
  -c:a aac -b:a 128k -ac 2 \\
  -t ${Math.ceil(totalDuration)} \\
  "${outputFilename}"`;

        await executeFFmpeg(command);
        console.log(`\n✅ Video combination completed: ${outputFilename}`);

    } catch (error) {
        console.error('❌ Error combining videos:', error);
        throw error;
    }
}

export async function finalCombiner(): Promise<boolean> {
    try {
        await combineVideos();
        return true
    } catch (error) {
        console.log({ error })
        return false
    }
}
