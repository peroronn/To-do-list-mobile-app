import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// FAB Component
// This component represents a Floating Action Button that triggers an action when pressed.
const FAB = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Add icon from Ionicons */}
      <Ionicons name="add" size={30} color="white" />
    </TouchableOpacity>
  );
};

// Styles for the FAB component
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007CBB', // Button background color
    width: 60, // Width of the button
    height: 60, // Height of the button
    borderRadius: 30, // Circular shape
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    position: 'absolute', // Absolute positioning
    bottom: 20, // Distance from the bottom of the screen
    right: 20, // Distance from the right side of the screen
    elevation: 2, // Elevation for Android shadow effect
    shadowColor: '#000', // Shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // Shadow offset for iOS
    shadowOpacity: 0.8, // Shadow opacity for iOS
    shadowRadius: 2, // Shadow radius for iOS
  },
});

export default FAB;
