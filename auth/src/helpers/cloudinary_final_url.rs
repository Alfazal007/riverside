pub fn cloudinary_url_final_video(cloud_name: &str, public_id: &str) -> String {
    format!(
        "https://res.cloudinary.com/{}/video/upload/{}.mp4",
        cloud_name, public_id
    )
}
