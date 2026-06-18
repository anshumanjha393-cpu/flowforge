import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "./prisma.js";

// Serialize user ID into session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session by ID
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, name: true },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const backendUrl = process.env.BACKEND_URL || "http://localhost:5001";

// Configure Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: `${backendUrl}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"), undefined);
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || profile.name?.givenName || "Google User",
                googleId: profile.id,
                status: "ACTIVE",
                role: "MEMBER",
                password: "",
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { email },
              data: { googleId: profile.id },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth credentials not configured. Google sign-in will be disabled.");
}

// Configure GitHub OAuth Strategy
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (githubClientId && githubClientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubClientId,
        clientSecret: githubClientSecret,
        callbackURL: `${backendUrl}/api/auth/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          let email = profile.emails?.[0]?.value;

          if (!email) {
            try {
              const res = await fetch("https://api.github.com/user/emails", {
                headers: { Authorization: `token ${accessToken}` },
              });
              const emails = await res.json();
              if (Array.isArray(emails)) {
                const primaryEmail = emails.find((e: any) => e.primary) || emails[0];
                email = primaryEmail?.email;
              }
            } catch (err) {
              console.error("Failed to fetch email from GitHub API", err);
            }
          }

          if (!email) {
            email = `${profile.username || profile.id}@github.flowforge.local`;
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName || profile.username || "GitHub User",
                githubId: profile.id,
                status: "ACTIVE",
                role: "MEMBER",
                password: "",
              },
            });
          } else if (!user.githubId) {
            user = await prisma.user.update({
              where: { email },
              data: { githubId: profile.id },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
} else {
  console.warn("GitHub OAuth credentials not configured. GitHub sign-in will be disabled.");
}

export default passport;
