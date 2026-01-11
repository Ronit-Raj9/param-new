/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      // Auth endpoints
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
      // Current user profile (maps to /auth/me)
      {
        source: '/api/me',
        destination: `${backendUrl}/api/v1/auth/me`,
      },
      // Admin dashboard
      {
        source: '/api/admin/dashboard/:path*',
        destination: `${backendUrl}/api/v1/dashboard/admin/:path*`,
      },
      // Admin settings
      {
        source: '/api/admin/settings/:path*',
        destination: `${backendUrl}/api/v1/settings/:path*`,
      },
      {
        source: '/api/admin/settings',
        destination: `${backendUrl}/api/v1/settings`,
      },
      // Admin users
      {
        source: '/api/admin/users/:path*',
        destination: `${backendUrl}/api/v1/users/:path*`,
      },
      {
        source: '/api/admin/users',
        destination: `${backendUrl}/api/v1/users`,
      },
      // Admin students
      {
        source: '/api/admin/students/:path*',
        destination: `${backendUrl}/api/v1/students/:path*`,
      },
      {
        source: '/api/admin/students',
        destination: `${backendUrl}/api/v1/students`,
      },
      // Admin results
      {
        source: '/api/admin/results/:path*',
        destination: `${backendUrl}/api/v1/results/:path*`,
      },
      {
        source: '/api/admin/results',
        destination: `${backendUrl}/api/v1/results`,
      },
      // Admin curriculum
      {
        source: '/api/admin/curriculum/:path*',
        destination: `${backendUrl}/api/v1/curriculum/:path*`,
      },
      {
        source: '/api/admin/curriculum',
        destination: `${backendUrl}/api/v1/curriculum`,
      },
      // Admin approvals
      {
        source: '/api/admin/approvals/:path*',
        destination: `${backendUrl}/api/v1/approvals/:path*`,
      },
      {
        source: '/api/admin/approvals',
        destination: `${backendUrl}/api/v1/approvals`,
      },
      // Admin degrees
      {
        source: '/api/admin/degrees/:path*',
        destination: `${backendUrl}/api/v1/degrees/:path*`,
      },
      {
        source: '/api/admin/degrees',
        destination: `${backendUrl}/api/v1/degrees`,
      },
      // Admin credentials
      {
        source: '/api/admin/credentials/:path*',
        destination: `${backendUrl}/api/v1/credentials/:path*`,
      },
      {
        source: '/api/admin/credentials',
        destination: `${backendUrl}/api/v1/credentials`,
      },
      // Admin issuance & jobs
      {
        source: '/api/admin/issuance/:path*',
        destination: `${backendUrl}/api/v1/issuance/:path*`,
      },
      {
        source: '/api/admin/issuance',
        destination: `${backendUrl}/api/v1/issuance`,
      },
      {
        source: '/api/admin/jobs/:path*',
        destination: `${backendUrl}/api/v1/issuance/jobs/:path*`,
      },
      // Admin audit logs
      {
        source: '/api/admin/logs/:path*',
        destination: `${backendUrl}/api/v1/audit/:path*`,
      },
      {
        source: '/api/admin/logs',
        destination: `${backendUrl}/api/v1/audit`,
      },
      // Admin corrections (under results)
      {
        source: '/api/admin/corrections/:path*',
        destination: `${backendUrl}/api/v1/results/corrections/:path*`,
      },
      {
        source: '/api/admin/corrections',
        destination: `${backendUrl}/api/v1/results/corrections`,
      },
      // Student dashboard
      {
        source: '/api/student/dashboard',
        destination: `${backendUrl}/api/v1/dashboard/student`,
      },
      // Student results
      {
        source: '/api/student/results/:path*',
        destination: `${backendUrl}/api/v1/results/student/:path*`,
      },
      {
        source: '/api/student/results',
        destination: `${backendUrl}/api/v1/results/student`,
      },
      // Student credentials
      {
        source: '/api/student/credentials/:path*',
        destination: `${backendUrl}/api/v1/credentials/student/:path*`,
      },
      {
        source: '/api/student/credentials',
        destination: `${backendUrl}/api/v1/credentials/student`,
      },
      // Student shares
      {
        source: '/api/student/shares/:path*',
        destination: `${backendUrl}/api/v1/credentials/shares/:path*`,
      },
      {
        source: '/api/student/shares',
        destination: `${backendUrl}/api/v1/credentials/shares`,
      },
      // Student degree
      {
        source: '/api/student/degree',
        destination: `${backendUrl}/api/v1/credentials/student/degree`,
      },
      // Public verification
      {
        source: '/api/verify/:path*',
        destination: `${backendUrl}/api/v1/verify/:path*`,
      },
      {
        source: '/api/verify',
        destination: `${backendUrl}/api/v1/verify`,
      },
      // Health check
      {
        source: '/api/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
}

export default nextConfig