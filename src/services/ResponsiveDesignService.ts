import React from 'react';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { createLogger } from '../utils/logger';

const logger = createLogger('ResponsiveDesignService');

// Device size categories
export enum DeviceSize {
  SMALL = 'small',     // < 5" phones
  MEDIUM = 'medium',   // 5-6" phones
  LARGE = 'large',     // 6"+ phones
  TABLET = 'tablet',   // tablets
  DESKTOP = 'desktop', // large screens/web
}

// Device orientation
export enum DeviceOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

// Breakpoints for responsive design
export interface Breakpoints {
  small: number;
  medium: number;
  large: number;
  tablet: number;
  desktop: number;
}

// Responsive dimensions
export interface ResponsiveDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceSize: DeviceSize;
  orientation: DeviceOrientation;
  pixelRatio: number;
  fontScale: number;
  safeAreaInsets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// Typography scaling configuration
export interface TypographyScale {
  [DeviceSize.SMALL]: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
    button: number;
  };
  [DeviceSize.MEDIUM]: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
    button: number;
  };
  [DeviceSize.LARGE]: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
    button: number;
  };
  [DeviceSize.TABLET]: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
    button: number;
  };
  [DeviceSize.DESKTOP]: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
    h5: number;
    h6: number;
    body: number;
    caption: number;
    button: number;
  };
}

// Spacing scale
export interface SpacingScale {
  [DeviceSize.SMALL]: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  [DeviceSize.MEDIUM]: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  [DeviceSize.LARGE]: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  [DeviceSize.TABLET]: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  [DeviceSize.DESKTOP]: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

// Layout configuration
export interface LayoutConfig {
  columns: number;
  maxWidth?: number;
  padding: number;
  margin: number;
  gap: number;
}

class ResponsiveDesignService {
  private static instance: ResponsiveDesignService;
  private dimensions: ResponsiveDimensions;
  private listeners: Array<(dimensions: ResponsiveDimensions) => void> = [];
  
  // Default breakpoints (in logical pixels)
  private breakpoints: Breakpoints = {
    small: 360,   // Small phones
    medium: 414,  // Medium phones
    large: 480,   // Large phones
    tablet: 768,  // Tablets
    desktop: 1024, // Desktop/large tablets
  };

  // Typography scales for different device sizes
  private typographyScale: TypographyScale = {
    [DeviceSize.SMALL]: {
      h1: 24,
      h2: 20,
      h3: 18,
      h4: 16,
      h5: 14,
      h6: 12,
      body: 14,
      caption: 12,
      button: 14,
    },
    [DeviceSize.MEDIUM]: {
      h1: 28,
      h2: 24,
      h3: 20,
      h4: 18,
      h5: 16,
      h6: 14,
      body: 16,
      caption: 14,
      button: 16,
    },
    [DeviceSize.LARGE]: {
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
      h5: 18,
      h6: 16,
      body: 18,
      caption: 16,
      button: 18,
    },
    [DeviceSize.TABLET]: {
      h1: 40,
      h2: 36,
      h3: 32,
      h4: 28,
      h5: 24,
      h6: 20,
      body: 20,
      caption: 18,
      button: 20,
    },
    [DeviceSize.DESKTOP]: {
      h1: 48,
      h2: 42,
      h3: 36,
      h4: 32,
      h5: 28,
      h6: 24,
      body: 22,
      caption: 20,
      button: 22,
    },
  };

  // Spacing scales for different device sizes
  private spacingScale: SpacingScale = {
    [DeviceSize.SMALL]: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
    },
    [DeviceSize.MEDIUM]: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
    [DeviceSize.LARGE]: {
      xs: 6,
      sm: 12,
      md: 18,
      lg: 24,
      xl: 30,
      xxl: 36,
    },
    [DeviceSize.TABLET]: {
      xs: 8,
      sm: 16,
      md: 24,
      lg: 32,
      xl: 40,
      xxl: 48,
    },
    [DeviceSize.DESKTOP]: {
      xs: 12,
      sm: 20,
      md: 32,
      lg: 40,
      xl: 48,
      xxl: 64,
    },
  };

  public static getInstance(): ResponsiveDesignService {
    if (!ResponsiveDesignService.instance) {
      ResponsiveDesignService.instance = new ResponsiveDesignService();
    }
    return ResponsiveDesignService.instance;
  }

  constructor() {
    this.dimensions = this.calculateDimensions();
    this.setupDimensionListener();
  }

  // Initialize responsive design service
  public async initialize(): Promise<void> {
    try {
      logger.info('📐 Initializing responsive design service...');

      // Update initial dimensions
      this.dimensions = this.calculateDimensions();

      logger.info(`📐 Device: ${this.dimensions.deviceSize}, ${this.dimensions.width}x${this.dimensions.height}, ${this.dimensions.orientation}`);
      logger.info('✅ Responsive design service initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing responsive design service:', error);
      throw error;
    }
  }

  // Set up dimension change listener
  private setupDimensionListener(): void {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newDimensions = this.calculateDimensions();
      const oldSize = this.dimensions.deviceSize;
      const oldOrientation = this.dimensions.orientation;

      this.dimensions = newDimensions;

      // Log significant changes
      if (oldSize !== newDimensions.deviceSize || oldOrientation !== newDimensions.orientation) {
        logger.info(`📐 Dimension change: ${newDimensions.deviceSize}, ${newDimensions.orientation}`);
      }

      // Notify listeners
      this.notifyListeners();
    });

    // Store subscription for cleanup (if needed)
    // Note: In newer React Native versions, this returns a subscription object
  }

  // Calculate current dimensions and device characteristics
  private calculateDimensions(): ResponsiveDimensions {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();
    
    const isLandscape = width > height;
    const isPortrait = !isLandscape;
    const orientation = isLandscape ? DeviceOrientation.LANDSCAPE : DeviceOrientation.PORTRAIT;
    
    // Use the smaller dimension to determine device size (consistent across orientations)
    const smallerDimension = Math.min(width, height);
    const deviceSize = this.determineDeviceSize(smallerDimension);

    return {
      width,
      height,
      isLandscape,
      isPortrait,
      deviceSize,
      orientation,
      pixelRatio,
      fontScale,
    };
  }

  // Determine device size category based on screen width
  private determineDeviceSize(width: number): DeviceSize {
    if (width >= this.breakpoints.desktop) {
      return DeviceSize.DESKTOP;
    } else if (width >= this.breakpoints.tablet) {
      return DeviceSize.TABLET;
    } else if (width >= this.breakpoints.large) {
      return DeviceSize.LARGE;
    } else if (width >= this.breakpoints.medium) {
      return DeviceSize.MEDIUM;
    } else {
      return DeviceSize.SMALL;
    }
  }

  // Get current responsive dimensions
  public getDimensions(): ResponsiveDimensions {
    return { ...this.dimensions };
  }

  // Check if device matches specific size
  public isDeviceSize(size: DeviceSize): boolean {
    return this.dimensions.deviceSize === size;
  }

  // Check if device is in specific orientation
  public isOrientation(orientation: DeviceOrientation): boolean {
    return this.dimensions.orientation === orientation;
  }

  // Get responsive font size
  public getFontSize(
    textStyle: keyof TypographyScale[DeviceSize],
    deviceSize?: DeviceSize
  ): number {
    const targetSize = deviceSize || this.dimensions.deviceSize;
    const baseSize = this.typographyScale[targetSize][textStyle];
    
    // Apply font scaling for accessibility
    return Math.round(baseSize * this.dimensions.fontScale);
  }

  // Get responsive spacing
  public getSpacing(
    spacingKey: keyof SpacingScale[DeviceSize],
    deviceSize?: DeviceSize
  ): number {
    const targetSize = deviceSize || this.dimensions.deviceSize;
    return this.spacingScale[targetSize][spacingKey];
  }

  // Get layout configuration for current device
  public getLayoutConfig(): LayoutConfig {
    const deviceSize = this.dimensions.deviceSize;
    const isLandscape = this.dimensions.isLandscape;

    switch (deviceSize) {
      case DeviceSize.SMALL:
        return {
          columns: isLandscape ? 2 : 1,
          padding: this.getSpacing('md'),
          margin: this.getSpacing('sm'),
          gap: this.getSpacing('sm'),
        };
      case DeviceSize.MEDIUM:
        return {
          columns: isLandscape ? 2 : 1,
          padding: this.getSpacing('lg'),
          margin: this.getSpacing('md'),
          gap: this.getSpacing('md'),
        };
      case DeviceSize.LARGE:
        return {
          columns: isLandscape ? 3 : 1,
          padding: this.getSpacing('lg'),
          margin: this.getSpacing('md'),
          gap: this.getSpacing('md'),
        };
      case DeviceSize.TABLET:
        return {
          columns: isLandscape ? 3 : 2,
          maxWidth: 1024,
          padding: this.getSpacing('xl'),
          margin: this.getSpacing('lg'),
          gap: this.getSpacing('lg'),
        };
      case DeviceSize.DESKTOP:
        return {
          columns: isLandscape ? 4 : 3,
          maxWidth: 1200,
          padding: this.getSpacing('xxl'),
          margin: this.getSpacing('xl'),
          gap: this.getSpacing('xl'),
        };
      default:
        return {
          columns: 1,
          padding: this.getSpacing('md'),
          margin: this.getSpacing('sm'),
          gap: this.getSpacing('sm'),
        };
    }
  }

  // Get responsive width for components
  public getResponsiveWidth(percentage: number): number {
    return Math.round(this.dimensions.width * (percentage / 100));
  }

  // Get responsive height for components
  public getResponsiveHeight(percentage: number): number {
    return Math.round(this.dimensions.height * (percentage / 100));
  }

  // Scale value based on device size
  public scaleSize(baseSize: number, scaleFactor?: number): number {
    const factor = scaleFactor || 1;
    const deviceMultiplier = this.getDeviceSizeMultiplier();
    return Math.round(baseSize * deviceMultiplier * factor);
  }

  // Get device size multiplier for scaling
  private getDeviceSizeMultiplier(): number {
    switch (this.dimensions.deviceSize) {
      case DeviceSize.SMALL:
        return 0.85;
      case DeviceSize.MEDIUM:
        return 1.0;
      case DeviceSize.LARGE:
        return 1.15;
      case DeviceSize.TABLET:
        return 1.3;
      case DeviceSize.DESKTOP:
        return 1.5;
      default:
        return 1.0;
    }
  }

  // Get responsive styles object
  public getResponsiveStyles() {
    const layout = this.getLayoutConfig();
    const deviceSize = this.dimensions.deviceSize;

    return {
      container: {
        width: '100%',
        maxWidth: layout.maxWidth,
        paddingHorizontal: layout.padding,
        marginHorizontal: layout.margin,
      },
      text: {
        h1: { fontSize: this.getFontSize('h1') },
        h2: { fontSize: this.getFontSize('h2') },
        h3: { fontSize: this.getFontSize('h3') },
        h4: { fontSize: this.getFontSize('h4') },
        h5: { fontSize: this.getFontSize('h5') },
        h6: { fontSize: this.getFontSize('h6') },
        body: { fontSize: this.getFontSize('body') },
        caption: { fontSize: this.getFontSize('caption') },
        button: { fontSize: this.getFontSize('button') },
      },
      spacing: {
        xs: this.getSpacing('xs'),
        sm: this.getSpacing('sm'),
        md: this.getSpacing('md'),
        lg: this.getSpacing('lg'),
        xl: this.getSpacing('xl'),
        xxl: this.getSpacing('xxl'),
      },
      layout: {
        columns: layout.columns,
        gap: layout.gap,
        isTablet: deviceSize === DeviceSize.TABLET || deviceSize === DeviceSize.DESKTOP,
        isPhone: deviceSize === DeviceSize.SMALL || deviceSize === DeviceSize.MEDIUM || deviceSize === DeviceSize.LARGE,
        isLandscape: this.dimensions.isLandscape,
        isPortrait: this.dimensions.isPortrait,
      },
    };
  }

  // Media query-like helpers
  public isSmallDevice(): boolean {
    return this.dimensions.deviceSize === DeviceSize.SMALL;
  }

  public isMediumDevice(): boolean {
    return this.dimensions.deviceSize === DeviceSize.MEDIUM;
  }

  public isLargeDevice(): boolean {
    return this.dimensions.deviceSize === DeviceSize.LARGE;
  }

  public isTablet(): boolean {
    return this.dimensions.deviceSize === DeviceSize.TABLET;
  }

  public isDesktop(): boolean {
    return this.dimensions.deviceSize === DeviceSize.DESKTOP;
  }

  public isPhone(): boolean {
    return [DeviceSize.SMALL, DeviceSize.MEDIUM, DeviceSize.LARGE].includes(this.dimensions.deviceSize);
  }

  public isLandscape(): boolean {
    return this.dimensions.isLandscape;
  }

  public isPortrait(): boolean {
    return this.dimensions.isPortrait;
  }

  // Subscribe to dimension changes
  public subscribe(listener: (dimensions: ResponsiveDimensions) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of dimension changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.dimensions);
      } catch (error) {
        logger.error('❌ Error notifying responsive design listener:', error);
      }
    });
  }

  // Update breakpoints
  public setBreakpoints(newBreakpoints: Partial<Breakpoints>): void {
    this.breakpoints = { ...this.breakpoints, ...newBreakpoints };
    
    // Recalculate dimensions with new breakpoints
    this.dimensions = this.calculateDimensions();
    this.notifyListeners();
    
    logger.info('📐 Breakpoints updated');
  }

  // Get current breakpoints
  public getBreakpoints(): Breakpoints {
    return { ...this.breakpoints };
  }

  // Cleanup
  public cleanup(): void {
    try {
      this.listeners = [];
      logger.info('🧹 Responsive design service cleaned up');
    } catch (error) {
      logger.error('❌ Error cleaning up responsive design service:', error);
    }
  }
}

// Export singleton instance
export const responsiveDesignService = ResponsiveDesignService.getInstance();

// Export React hook
export const useResponsiveDesign = () => {
  const [dimensions, setDimensions] = React.useState<ResponsiveDimensions>(
    responsiveDesignService.getDimensions()
  );

  React.useEffect(() => {
    const unsubscribe = responsiveDesignService.subscribe((newDimensions) => {
      setDimensions(newDimensions);
    });

    return unsubscribe;
  }, []);

  return {
    dimensions,
    deviceSize: dimensions.deviceSize,
    orientation: dimensions.orientation,
    isLandscape: dimensions.isLandscape,
    isPortrait: dimensions.isPortrait,
    
    // Device size checks
    isSmallDevice: responsiveDesignService.isSmallDevice(),
    isMediumDevice: responsiveDesignService.isMediumDevice(),
    isLargeDevice: responsiveDesignService.isLargeDevice(),
    isTablet: responsiveDesignService.isTablet(),
    isDesktop: responsiveDesignService.isDesktop(),
    isPhone: responsiveDesignService.isPhone(),
    
    // Sizing functions
    getFontSize: responsiveDesignService.getFontSize.bind(responsiveDesignService),
    getSpacing: responsiveDesignService.getSpacing.bind(responsiveDesignService),
    getLayoutConfig: responsiveDesignService.getLayoutConfig.bind(responsiveDesignService),
    getResponsiveWidth: responsiveDesignService.getResponsiveWidth.bind(responsiveDesignService),
    getResponsiveHeight: responsiveDesignService.getResponsiveHeight.bind(responsiveDesignService),
    scaleSize: responsiveDesignService.scaleSize.bind(responsiveDesignService),
    getResponsiveStyles: responsiveDesignService.getResponsiveStyles.bind(responsiveDesignService),
  };
};

export default responsiveDesignService; 