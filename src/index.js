import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { createServer } from '~/server'

const START_SERVER = () => {
  const server = createServer()

  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => {
      console.log(`Running at production port ${process.env.PORT}`)
    })
  } else {
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, () => {
      console.log(
        `Running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`
      )
    })
  }

  exitHook(() => {
    CLOSE_DB()
  })
};

(async () => {
  try {
    await CONNECT_DB()
    console.log('Database connected successfully')
    START_SERVER()
    console.log('Server started successfully')
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(0)
  }
})()
