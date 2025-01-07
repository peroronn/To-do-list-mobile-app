import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, BackHandler } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; 
import DateTimePickerModal from 'react-native-modal-datetime-picker'; 
import { format } from 'date-fns'; 
import { insertTask } from './database'; 

// TaskInputModal Component
// This modal allows the user to input a new task, set a due date, and set a reminder time.
const TaskInputModal = ({ visible, onClose, onSave }) => {
  const [taskText, setTaskText] = useState(''); // State to store the task description
  const [dueDate, setDueDate] = useState(null); // State to store the selected due date
  const [reminderTime, setReminderTime] = useState(null); // State to store the selected reminder time
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false); // State to control the visibility of the date picker
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false); // State to control the visibility of the time picker
  const [dueDateText, setDueDateText] = useState('Set Due Date'); // Text to display the selected due date
  const [reminderText, setReminderText] = useState('Set Reminder'); // Text to display the selected reminder time
  const textInputRef = useRef(null); // Reference to the task input field

  // Function to handle saving the task
  const handleSave = async () => {
    if (!taskText.trim()) return; // If the task description is empty, do not save

    // Format the due date and reminder time
    const formattedDueDate = dueDate ? format(dueDate, 'PPP') : null;
    const formattedReminderTime = reminderTime ? format(reminderTime, 'p') : null;

    // Insert the task into the database
    await insertTask(taskText, formattedDueDate, formattedReminderTime);

    // Call the onSave function passed as a prop
    onSave(taskText, formattedDueDate, formattedReminderTime);

    // Reset the state after saving
    setTaskText('');
    setDueDate(null);
    setReminderTime(null);
    setDueDateText('Set Due Date');
    setReminderText('Set Reminder');

    // Close the modal
    onClose();
  };

  // Focus the text input field when the modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 50);
    }
  }, [visible]);

  // Show the date picker when the user wants to set a due date
  const showDatePicker = () => {
    setDatePickerVisibility(true);
    setDueDate(null);
    setReminderTime(null);
  };

  // Hide the date picker
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  // Handle the date selected by the user
  const handleDateConfirm = (date) => {
    setDueDate(date); // Set the due date
    setDueDateText(format(date, 'PPP')); // Update the displayed due date text
    hideDatePicker(); // Hide the date picker
  };

  // Show the time picker when the user wants to set a reminder
  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  // Hide the time picker
  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  // Handle the time selected by the user
  const handleTimeConfirm = (time) => {
    setReminderTime(time); // Set the reminder time
    setReminderText(format(time, 'p')); // Update the displayed reminder text
    hideTimePicker(); // Hide the time picker
  };

  // Handle closing the modal
  const handleModalClose = () => {
    setDueDateText('Set Due Date'); // Reset the due date text
    setReminderText('Set Reminder'); // Reset the reminder text
    setTaskText('');
    onClose(); // Close the modal
  };

  // Handle back button press on Android to close the modal
  useEffect(() => {
    const backAction = () => {
      if (visible) 
      {
        onClose(); // Close the modal if it's visible
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', backAction); // Add event listener for back button

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backAction); // Remove event listener when component unmounts
    };
  }, [visible]);

  return (
    <Modal
      visible={visible} // Control visibility of the modal
      transparent={true} // Make the modal background transparent
      onRequestClose={onClose} // Handle the request to close the modal
    >
      <TouchableWithoutFeedback onPress={handleModalClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TextInput
                  ref={textInputRef}
                  style={styles.textInput}
                  placeholder="Enter task description" // Placeholder text
                  value={taskText} // Bind the task description to state
                  onChangeText={setTaskText} // Update state on text change
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.iconButton} onPress={showDatePicker}>
                    <Ionicons name="calendar-outline" size={24} color="#007CBB" />
                    <Text style={styles.buttonText}>{dueDateText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={showTimePicker}>
                    <Ionicons name="alarm-outline" size={24} color="#007CBB" />
                    <Text style={styles.buttonText}>{reminderText}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
      <DateTimePickerModal
        isVisible={isDatePickerVisible} // Control visibility of the date picker
        mode="date" // Set mode to date picker
        date={dueDate || new Date()} // Set initial date to due date or current date
        onConfirm={handleDateConfirm} // Handle date confirm action
        onCancel={hideDatePicker} // Handle cancel action
      />
      <DateTimePickerModal
        isVisible={isTimePickerVisible} // Control visibility of the time picker
        mode="time" // Set mode to time picker
        date={reminderTime || new Date()} // Set initial time to reminder time or current time
        onConfirm={handleTimeConfirm} // Handle time confirm action
        onCancel={hideTimePicker} // Handle cancel action
      />
    </Modal>
  );
};

// Styles for the modal and its components
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
  },
  modalContent: {
    backgroundColor: 'white', // White background for modal content
    borderRadius: 10, // Rounded corners
    padding: 20,
    elevation: 5, // Shadow effect on Android
  },
  textInput: {
    borderBottomWidth: 1, // Bottom border
    borderBottomColor: '#ccc', // Border color
    marginBottom: 20,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row', // Align buttons in a row
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center', // Center icon and text
  },
  buttonText: {
    fontSize: 12,
    color: '#007CBB', // Button text color
  },
  saveButton: {
    backgroundColor: '#007CBB', // Button background color
    padding: 10,
    borderRadius: 5, // Rounded corners
  },
  saveButtonText: {
    color: 'white', // Save button text color
    fontWeight: 'bold',
  },
});

export default TaskInputModal; // Export the TaskInputModal component
