import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to Family Loop",
    subtitle: "We are here to improve your communication with family",
    emoji: "👋",
    description: "Let's help you stay closer to the people who matter most"
  },
  {
    id: 2,
    title: "No Endless Scrolling",
    subtitle: "We are not about endless scrolling but making you feel closer to loved ones and friends",
    emoji: "🧘‍♂️",
    description: "Your time is precious. We focus on meaningful connections."
  },
  {
    id: 3,
    title: "Remember Everyone",
    subtitle: "Even that Uncle who you may end up texting only on Christmas LOL",
    emoji: "🎄",
    description: "Our app helps you remember and reach out to family you haven't talked to in a while"
  },
  {
    id: 4,
    title: "Ready to Get Into It?",
    subtitle: "Login or sign up next...",
    emoji: "🚀",
    description: "Let's start building stronger family connections together"
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - go to welcome/auth screen
      router.push('/(auth)/welcome');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/welcome');
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <View style={styles.container}>
      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStep ? styles.progressDotActive : styles.progressDotInactive
            ]}
          />
        ))}
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{currentStepData.emoji}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentStepData.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{currentStepData.description}</Text>
      </View>

      {/* Bottom Action */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLastStep ? "Let's Start!" : "Continue"}
          </Text>
        </TouchableOpacity>

        {/* Step counter */}
        <Text style={styles.stepCounter}>
          {currentStep + 1} of {onboardingSteps.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#3498DB',
  },
  progressDotInactive: {
    backgroundColor: '#E0E0E0',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    color: '#34495E',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  actionContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#3498DB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stepCounter: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '500',
  },
});