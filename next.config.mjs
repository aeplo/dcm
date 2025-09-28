/** @type {import('next').NextConfig} */
     const nextConfig = {
       experimental: {
         serverActions: {
           allowedOrigins: [
             'localhost:3000',
             '*.app.github.dev',  // For Codespaces
             // Add other proxies/tunnels as needed, e.g., '*.ngrok.io'
           ],
         },
       },
     };

export default nextConfig
