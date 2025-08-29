import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import Icon from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getThemeColors } from '../styles/commonStyles';

interface ProfileImageProps {
  uri?: string | null;
  name?: string;
  size?: number;
  editable?: boolean;
  onImageChange?: (uri: string) => void;
  style?: ViewStyle;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  uri,
  name = '',
  size = 80,
  editable = false,
  onImageChange,
  style,
}) => {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  
  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to change your profile picture.');
        return;
      }
      
      // Launch image picker with explicit options for cross-platform compatibility
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use enum for better type safety
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        exif: false, // Disable EXIF data to improve Android compatibility
      });
      
      console.log('Image picker result:', JSON.stringify(result));
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        console.log('Selected image URI:', selectedImage);
        if (onImageChange) {
          onImageChange(selectedImage);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select profile picture');
    }
  };

  const containerSize = { width: size, height: size, borderRadius: size / 2 };
  const badgeSize = size * 0.325;
  
  const AvatarComponent = (
    <View style={[themedStyles.avatar, containerSize, style]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[themedStyles.avatarImage, containerSize]}
          onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
        />
      ) : (
        <Text style={[themedStyles.avatarText, { fontSize: size * 0.4 }]}>
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </Text>
      )}
      {editable && (
        <View style={[themedStyles.avatarEditBadge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
          <Icon name="camera" size={badgeSize * 0.54} style={{ color: colors.white }} />
        </View>
      )}
    </View>
  );

  if (editable) {
    return (
      <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
        {AvatarComponent}
      </TouchableOpacity>
    );
  }

  return AvatarComponent;
};

const createStyles = (colors: ReturnType<typeof getThemeColors>, isDark: boolean) => {
  return StyleSheet.create({
    avatar: {
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'visible',
    },
    avatarImage: {
      borderWidth: 2,
      borderColor: colors.border,
    },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    avatarText: {
      fontWeight: 'bold',
      color: colors.white,
    },
  });
};

// Backward compatibility
const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default ProfileImage;