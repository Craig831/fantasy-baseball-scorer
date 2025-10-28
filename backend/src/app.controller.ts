import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fantasy Baseball Scorer API</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 16px;
            padding: 48px;
            max-width: 600px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            color: #2d3748;
            font-size: 32px;
            margin-bottom: 16px;
          }
          p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .status {
            display: inline-flex;
            align-items: center;
            background: #c6f6d5;
            color: #22543d;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            margin-bottom: 32px;
          }
          .status::before {
            content: '●';
            color: #38a169;
            font-size: 20px;
            margin-right: 8px;
          }
          .links {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          a {
            display: block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s;
          }
          a:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .info {
            margin-top: 32px;
            padding-top: 32px;
            border-top: 1px solid #e2e8f0;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            color: #4a5568;
            font-size: 14px;
          }
          .info-label {
            font-weight: 600;
          }
          code {
            background: #f7fafc;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            color: #2d3748;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚾ Fantasy Baseball Scorer</h1>
          <div class="status">API Running</div>
          <p>
            Welcome to the Fantasy Baseball Scorer API. This backend provides
            authentication, player research, scoring configurations, and lineup management.
          </p>

          <div class="links">
            <a href="/api/docs" target="_blank">📖 View API Documentation (Swagger)</a>
            <a href="http://localhost:3001" target="_blank">🎯 Open Frontend Application</a>
          </div>

          <div class="info">
            <div class="info-item">
              <span class="info-label">Base API URL:</span>
              <code>http://localhost:3000/api</code>
            </div>
            <div class="info-item">
              <span class="info-label">Environment:</span>
              <code>${process.env.NODE_ENV || 'development'}</code>
            </div>
            <div class="info-item">
              <span class="info-label">Port:</span>
              <code>${process.env.PORT || 3000}</code>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.type('text/html').send(html);
  }
}
