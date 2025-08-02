export const serverConfig = {
  port: Number(process.env.PORT) || 8001,
  apiVersion: Number(process.env.API_VERSION) || 1,
  environment: process.env.NODE_ENV || 'development',
  
  // Derived configurations
  get isDevelopment() {
    return this.environment === 'development';
  },
  
  get isProduction() {
    return this.environment === 'production';
  },
  
  get baseUrl() {
    return `http://localhost:${this.port}`;
  }
};