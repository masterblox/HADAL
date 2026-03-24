import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  retries: 0,
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'tests/screenshots',
})
