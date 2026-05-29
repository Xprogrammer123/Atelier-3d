interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>
}

interface Navigator {
  xr?: XRSystem
}
