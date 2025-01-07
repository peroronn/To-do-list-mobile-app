import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { updateTask, deleteTask} from '../database';

export default function EditTaskScreen({ route, navigation }) {
  // Destructuring the task properties from route parameters
  const {
    taskid,
    tasktext,
    duedate,
    favorite,
    alarm,
    donestatus,
    description,
    repeatstatus,
    selectedDaysOfWeek: initialSelectedDaysOfWeek,
    selectedDaysOfMonth: initialSelectedDaysOfMonth,
  } = route.params; 

  console.log('repeatoption is ', repeatstatus);
  // State variables to manage task properties locally
  const [taskText, setTaskText] = useState(tasktext || '');
  const [taskDescription, setTaskDescription] = useState(description || '');
  const [taskReminder, setTaskReminder] = useState(alarm || null);
  const [taskDueDate, setTaskDueDate] = useState(duedate || null);
  const [isComplete, setIsComplete] = useState(donestatus === 1 ? 1 : 0);
  const [isFavorite, setIsFavorite] = useState(favorite === 1 ? 1 : 0);
  const [repeatOption, setRepeatOption] = useState(repeatstatus || '');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  
  // State variables to manage repeat options
  const [isRepeatOptionVisible, setRepeatOptionVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const datesOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const [selectedDates, setSelectedDates] = useState([]);
  const [isDatePickerModalVisible, setDatePickerModalVisible] = useState(false);
  const [isDayPickerModalVisible, setDayPickerModalVisible] = useState(false);

  // Function to save task changes to the database
  const saveTaskToDatabase = async () => {
    try {
      // Update the main task
      await updateTask(taskid, taskText, isComplete, isFavorite, taskReminder, taskDueDate, repeatOption, taskDescription);
    } catch (error) {
      console.error('Error updating task or subtasks: ', error.message);
    }
  };
  // Automatically save the task when the screen is blurred (navigated away)
   useEffect(() => {
    const unsubscribe = navigation.addListener('blur', async () => {
      await saveTaskToDatabase();
    });

    // Cleanup the listener on component unmount
    return unsubscribe;
  }, );

// Customizing the navigation header with buttons for going back and deleting the task
  useLayoutEffect(() => {
  navigation.setOptions({
    headerLeft: () => (
      <TouchableOpacity style= {styles.titleBack}
        onPress={async () => {
          await saveTaskToDatabase();
          navigation.goBack();
        }}>
        <Ionicons name="arrow-back-outline" size={30} />
      </TouchableOpacity>
    ),
    title: 'Tasks',
    headerRight: () => (
      <TouchableOpacity  style= {styles.titleDelete}
        onPress={async () => {
          await deleteTasks(); // Call the delete function
        }}>
        <Ionicons name="trash-outline" size={30} />
      </TouchableOpacity>
    ),
  });
  }, );

  // Function to delete the task from the database
  const deleteTasks = async () => {
    try {
      console.log('delete for taskid -',taskid);
      await deleteTask(taskid); // Delete the main task
      navigation.goBack(); // Go back to the Tasks page
    } catch (error) {
      console.error('Error deleting task: ', error.message);
    }
  };

  // Function to toggle the completion status of the task
  const toggleCompletion = () => {
    setIsComplete(prevState => prevState === 1 ? 0 : 1);
  };

  // Function to toggle the favorite status of the task
  const toggleFavorite = () => {
    setIsFavorite(prevState => prevState === 1 ? 0 : 1);
  };
  // Date and Time Picker functions to handle showing and hiding
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date) => {
    const formattedDate = format(date, 'PPP');
    setTaskDueDate(formattedDate);
    hideDatePicker();
  };

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirmTime = (time) => {
    const formattedTime = format(time, 'p');
    setTaskReminder(formattedTime);
    hideTimePicker();
  };

  // Functions to clear reminder, due date, and repeat option
  const clearReminder = () => setTaskReminder(null);
  const clearDueDate = () => setTaskDueDate(null);
  const clearRepeatOption = () => setRepeatOption('');

  // Function to toggle the selection of days for the weekly repeat option
  const toggleDaySelection = (day) => {
    setSelectedDays(prevSelectedDays => 
      prevSelectedDays.includes(day)
        ? prevSelectedDays.filter(d => d !== day)
        : [...prevSelectedDays, day]
    );
  };
  // Function to toggle the selection of dates for the monthly repeat option
  const toggleDateSelection = (date) => {
    setSelectedDates(prevSelectedDates =>
      prevSelectedDates.includes(date)
        ? prevSelectedDates.filter(d => d !== date)
        : [...prevSelectedDates, date]
    );
  };


  // Render function for the Date Picker used in monthly repeat
  const renderDatePicker = () => (
    <View style={styles.datePickerContainer}>
      {datesOfMonth.map(date => (
        <TouchableOpacity
          key={date}
          style={[
            styles.datePickerButton,
            selectedDates.includes(date) && styles.datePickerButtonSelected
          ]}
          onPress={() => toggleDateSelection(date)}
        >
          <Text
            style={[
              styles.datePickerButtonText,
              selectedDates.includes(date) && styles.datePickerButtonTextSelected
            ]}
          >
            {date}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  // Function to handle monthly repeat selection
  const handleMonthlyRepeat = () => {
    setDatePickerModalVisible(true); 
  };
   // Function to format the selected dates for the monthly repeat
  const formatSelectedDates = () => {
    return selectedDates.length > 0
      ? `Monthly\n${selectedDates.sort((a, b) => a - b).join(', ')}`
      : 'Monthly';
  };


   // Render function for the Day Picker used in weekly repeat
  const renderDayPicker = () => (
    <View style={styles.dayPickerContainer}>
      {daysOfWeek.map(day => (
        <TouchableOpacity
          key={day}
          style={[
            styles.dayPickerButton,
            selectedDays.includes(day) && styles.dayPickerButtonSelected
          ]}
          onPress={() => toggleDaySelection(day)}
        >
          <Text
            style={[
              styles.dayPickerButtonText,
              selectedDays.includes(day) && styles.dayPickerButtonTextSelected
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      ))}
      
    </View>
  
  );
  // Function to handle weekly repeat selection
  const handleWeeklyRepeat = () => {
  setDayPickerModalVisible(true);
  };
  // Function to format the selected days for the weekly repeat
  const formatSelectedDays = () => {
    const sortedDays = selectedDays.sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
    return sortedDays.length > 0
      ? `Weekly\n${sortedDays.join(', ')}`
      : 'Weekly';
  };

  

  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Editable Task Text */}
      <View style={styles.taskRow}>
        {/* Complete Icon */}
        <TouchableOpacity onPress={toggleCompletion}>
          <Ionicons
            name={isComplete === 1 ? 'checkmark-circle' : 'ellipse-outline'}
            size={30}
            color={isComplete === 1 ? '#007CBB' : 'black'}
          />
        </TouchableOpacity>

        {/* Task Text Input */}
        <TextInput
          style={[styles.taskText, isComplete && styles.taskCompleted]}
          value={taskText}
          onChangeText={setTaskText}
        />

        {/* Favorite Icon */}
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite === 1 ? 'star' : 'star-outline'}
            size={30}
            color={isFavorite === 1 ? 'gold' : 'black'}
          />
        </TouchableOpacity>
      </View>

      {/* Reminder, Due Date, Repeat */}
      <TouchableOpacity style={styles.optionRow} onPress={showTimePicker}>
        <Ionicons name="alarm-outline" size={24} />
        <Text style={styles.optionText}>Remind me</Text>
        {taskReminder && <Text style={styles.optionValue}>{taskReminder}</Text>}
        <TouchableOpacity onPress={clearReminder}>
          <Ionicons name="close-outline" size={24} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionRow} onPress={showDatePicker}>
        <Ionicons name="calendar-outline" size={24} />
        <Text style={styles.optionText}>Due Date</Text>
        {taskDueDate && <Text style={styles.optionValue}>{taskDueDate}</Text>}
        <TouchableOpacity onPress={clearDueDate}>
          <Ionicons name="close-outline" size={24} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionRow}
        onPress={() => setRepeatOptionVisible(!isRepeatOptionVisible)}>
        <Ionicons name="repeat-outline" size={24} />
        <Text style={styles.optionText}>Repeat</Text>
        <View style={styles.repeatOptionContainer}>
          <Text style={styles.optionValue}>{repeatOption}</Text>
        </View>
        <TouchableOpacity onPress={clearRepeatOption}>
          <Ionicons name="close-outline" size={24} color="black" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Repeat Option */}
      {isRepeatOptionVisible && (
        <View style={styles.repeatOptionsContainer}>
          <TouchableOpacity
            onPress={() => {
              setRepeatOption('Daily');
              setRepeatOptionVisible(false); // Hide options after selection
            }}>
            <Text style={styles.repeatOptionText}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWeeklyRepeat}>
            <Text style={styles.repeatOptionText}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMonthlyRepeat}>
            <Text style={styles.repeatOptionText}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setRepeatOptionVisible(false); // Hide options on Cancel
            }}>
            <Text style={styles.repeatOptionCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Day Picker Modal for Weekly Repeat */}
      <Modal
        visible={isDayPickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDayPickerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {renderDayPicker()}

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {setDayPickerModalVisible(false); setRepeatOptionVisible(false);}}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setRepeatOption(formatSelectedDays());
                  setDayPickerModalVisible(false);
                  setRepeatOptionVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal for Monthly Repeat */}
      <Modal
        visible={isDatePickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatePickerModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {renderDatePicker()}

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {setDatePickerModalVisible(false); setRepeatOptionVisible(false);}}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setRepeatOption(formatSelectedDates());
                  setDatePickerModalVisible(false);
                  setRepeatOptionVisible(false);
                }}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
      />

      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleConfirmTime}
        onCancel={hideTimePicker}
      />

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <TextInput
          style={styles.descriptionInput}
          multiline
          placeholder="Add Description"
          value={taskDescription}
          onChangeText={setTaskDescription}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  titleBack: {
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
  titleDelete: {
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  taskText: {
    flex: 1,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 18,
  },

  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  repeatOptionContainer: {
    alignSelf: 'flex-end', 
  },
  modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007CBB',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalButtonCancel: {
    backgroundColor: '#ccc',
  },
  modalButtonCancelText: {
    color: '#333',
  },
  repeatOptionsContainer: {
  marginLeft: 30,
  marginTop: 5,
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 10,
  },
  repeatOptionText: { 
    paddingVertical: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  repeatOptionCancelText: {
    paddingVertical: 10,
    fontSize: 16,
    color: 'red',
  },
  datePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  datePickerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    margin: 5,
    
  },
  datePickerButtonSelected: {
    backgroundColor: '#007CBB',
  },
  datePickerButtonTextSelected: {
    color: 'white',
  },
  datePickerButtonText: {
    color: 'black',
  },
  dayPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dayPickerButton: {
    width: 40, 
    height: 40, 
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center', 
    borderRadius: 20, 
    marginVertical: 5,
  },
  dayPickerButtonSelected: {
    backgroundColor: '#007CBB',
    borderColor: '#007CBB',
  },
  dayPickerButtonTextSelected: {
    color: 'white',
  },
  
  dayPickerButtonText: {
    color: 'black',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5,
  },
  optionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 18,
  },
  optionValue: {
    color: '#007CBB',
    whiteSpace: 'pre-line',
    textAlign: 'right', 
  },
  descriptionContainer: {
    marginVertical: 10,
  },
  descriptionInput: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    fontSize: 18,
  },
});