export async function loadTmjFile(assetModule: any): Promise<any> {
  try {
    // If it's a required module
    if (assetModule && typeof assetModule === 'object') {
      return assetModule.default || assetModule;
    }
    
    throw new Error('Invalid TMJ file format');
  } catch (error) {
    console.error('Error loading TMJ file:', error);
    throw error;
  }
}
