import React, { createContext, useState } from "react";

type User = {
    userId: number,
    accessToken: string,
    email: string
}

export const UserContext = createContext<{
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}>({
    user: null,
    setUser: () => { }
});

const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider >
    );
};

export default UserProvider;
