export type EstablishConnectionMessage = {
    accessToken: string,
    username: string,
    userId: number,
    meetId: number
}

export type RtpCapabilitiesMessage = {
    meetId: number
}
