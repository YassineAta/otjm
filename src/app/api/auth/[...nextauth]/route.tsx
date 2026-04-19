// src/app/api/auth/[...nextauth]/route.js

import NextAuth from "next-auth";
import { authOptions } from "./options"; // <-- Your actual configuration object

// Initialize NextAuth with your options
const handler = NextAuth(authOptions);

// Export the handlers required by Next.js App Router for all NextAuth requests
export { handler as GET, handler as POST };