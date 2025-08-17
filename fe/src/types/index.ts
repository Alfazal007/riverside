export interface User {
    id: string;
    username: string;
    email: string;
}

export interface Meet {
    id: number;
    meet_id: string;
    is_host: boolean
}

export interface Participant {
    id: string;
    email: string;
    role: 'host' | 'guest';
    status: 'invited' | 'joined' | 'declined';
}

export interface SignupFormData {
    username: string;
    email: string;
    password: string;
}

export interface LoginFormData {
    email: string;
    password: string;
}

export interface CreateMeetFormData {
    title: string;
}

export interface AddParticipantFormData {
    email: string;
}
