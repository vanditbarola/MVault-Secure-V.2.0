import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileImage from '../components/ProfileImage';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getThemeColors } from '../styles/commonStyles';
import Icon from '../components/Icon';

export default function ProfileDemo() {
  const { theme } = useTheme();
  const { styles: themedStyles, colors } = useThemedStyles(createStyles);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageChange = (uri: string) => {
    setProfileImage(uri);
  };

  return (
    <SafeAreaView style={themedStyles.container}>
      <Stack.Screen
        options={{
          title: 'Profile Image Demo',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={themedStyles.scrollView}>
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Profile Image Component</Text>
          <Text style={themedStyles.description}>
            A reusable component for displaying user profile images with various sizes and styles.
          </Text>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Editable Profile Image</Text>
          <View style={themedStyles.demoContainer}>
            <ProfileImage
              uri={profileImage}
              name="User"
              size={100}
              editable={true}
              onImageChange={handleImageChange}
            />
            <Text style={themedStyles.caption}>
              Tap to select an image
            </Text>
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Different Sizes</Text>
          <View style={themedStyles.sizesContainer}>
            <View style={themedStyles.sizeDemo}>
              <ProfileImage
                uri={profileImage}
                name="Small"
                size={40}
              />
              <Text style={themedStyles.sizeCaption}>Small (40px)</Text>
            </View>
            <View style={themedStyles.sizeDemo}>
              <ProfileImage
                uri={profileImage}
                name="Medium"
                size={60}
              />
              <Text style={themedStyles.sizeCaption}>Medium (60px)</Text>
            </View>
            <View style={themedStyles.sizeDemo}>
              <ProfileImage
                uri={profileImage}
                name="Large"
                size={80}
              />
              <Text style={themedStyles.sizeCaption}>Large (80px)</Text>
            </View>
          </View>
        </View>

        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Fallback Initials</Text>
          <View style={themedStyles.rowContainer}>
            <View style={themedStyles.initialsDemo}>
              <ProfileImage
                name="John Doe"
                size={60}
              />
              <Text style={themedStyles.initialsCaption}>"John Doe"</Text>
            </View>
            <View style={themedStyles.initialsDemo}>
              <ProfileImage
                name="Alice Smith"
                size={60}
              />
              <Text style={themedStyles.initialsCaption}>"Alice Smith"</Text>
            </View>
            <View style={themedStyles.initialsDemo}>
              <ProfileImage
                name=""
                size={60}
              />
              <Text style={themedStyles.initialsCaption}>Empty name</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={themedStyles.backButton}
          onPress={() => {
            // Go back to previous screen
          }}
        >
          <Icon name="arrow-back" size={20} style={{ color: colors.white }} />
          <Text style={themedStyles.backButtonText}>Back to Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof getThemeColors>, isDark: boolean) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      padding: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    demoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginTop: 10,
    },
    caption: {
      marginTop: 10,
      fontSize: 14,
      color: colors.textSecondary,
    },
    sizesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginTop: 10,
    },
    sizeDemo: {
      alignItems: 'center',
    },
    sizeCaption: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textSecondary,
    },
    rowContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginTop: 10,
    },
    initialsDemo: {
      alignItems: 'center',
    },
    initialsCaption: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textSecondary,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 20,
      marginBottom: 30,
      marginTop: 10,
    },
    backButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
  });
};