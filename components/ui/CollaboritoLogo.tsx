import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
  color?: string;
  style?: any;
}

export const CollaboritoLogo = ({ size = 120, color = '#000', style }: LogoProps) => {
  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size} viewBox="0 0 500 500" fill="none">
        <G>
          {/* Hexagon background */}
          <Path
            d="M425 144.3L250 36.6L75 144.3v215.4L250 468l175-108.3V144.3z"
            fill="#FFFFFF"
            stroke={color}
            strokeWidth="10"
          />
          
          {/* Puzzle pieces */}
          <G fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            {/* Hand */}
            <Path d="M290 380c0 0-10-10-10-20v-30c0-10 10-10 10-10h20c10 0 10 10 10 10v30c0 10-10 10-10 10h-20z" />
            <Path d="M290 330h-30v-30h30" />
            <Path d="M310 330h30v-30h-30" />
            <Path d="M280 300h-30v-30h30" />
            
            {/* Puzzle pieces */}
            <Path d="M250 270c-10 0-10-10-10-10v-20c0-10 10-10 10-10h20c10 0 10-10 10-10v-20c0-10-10-10-10-10h-20c-10 0-10-10-10-10v-20" />
            <Path d="M250 190h-30c-10 0-10 10-10 10v20c0 10-10 10-10 10h-20c-10 0-10-10-10-10v-20c0-10 10-10 10-10h20" />
            <Path d="M200 190h-30v30h30" />
            <Path d="M170 220v30h30" />
            
            {/* Hand holding piece */}
            <Path d="M310 270v-30h30" />
            <Path d="M340 240h30v-30h-30" />
            <Path d="M370 210h30v-30h-30" />
          </G>
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 