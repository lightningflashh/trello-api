import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

import { env } from '~/config/environment'

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        done(null, profile)
      } catch (error) {
        done(error, null)
      }
    }
  )
)

export default passport
