import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getTasks, updateTaskStatus, updateFavoriteStatus } from '../database';
import { parse, format } from 'date-fns';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(''); // State to hold the selected date
  const [tasks, setTasks] = useState([]); // State to hold all tasks
  const [tasksForSelectedDate, setTasksForSelectedDate] = useState([]); // State to hold tasks for the selected date
  const [refresh, setRefresh] = useState(false); // State to trigger UI refresh
  
  const navigation = useNavigation(); // Hook to use navigation
  const isFocused = useIsFocused(); // Hook to check if the screen is focused


  useEffect(() => {
    if (isFocused) {
      fetchTasks();
    }
  }, [isFocused]);

  const fetchTasks = async () => {
    try {
      const taskList = await getTasks(); // Fetching tasks from the database
      const tasksWithDueDates = taskList.filter(task => task.duedate); // Filtering tasks with due dates
      setTasks(tasksWithDueDates); // Setting tasks state with tasks that have due dates

      if (selectedDate) {
        const formattedDate = format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'MMMM do, yyyy'); // Formatting the selected date
        const tasksOnDate = tasksWithDueDates.filter(task => task.duedate === formattedDate); // Filtering tasks for the selected date
        setTasksForSelectedDate(tasksOnDate); // Setting tasks for the selected date
      }

      setRefresh(prev => !prev); // Trigger UI refresh
    } catch (error) {
      console.error('Error fetching tasks: ', error.message); // Handling errors in fetching tasks
    }
  };


  const onDayPress = (day) => {
    setSelectedDate(day.dateString); // Update selected date when a day is pressed
    const formattedDate = format(parse(day.dateString, 'yyyy-MM-dd', new Date()), 'MMMM do, yyyy'); // Format the selected date
    console.log('Formatted date is ', formattedDate);
    const tasksOnDate = tasks.filter(task => task.duedate === formattedDate); // Filter tasks for the selected date
    console.log('Tasks on selected date are ', tasksOnDate);
    setTasksForSelectedDate(tasksOnDate); // Update state with tasks for the selected date
  };
  
  const toggleTaskStatus = async (taskid, currentStatus) => {
    const status = currentStatus === null ? 0 : currentStatus; // Handle null status
    const newStatus = status === 0 ? 1 : 0; // Toggle status between 0 and 1
    try {
      await updateTaskStatus(taskid, newStatus); // Update task status in the database
      fetchTasks(); // Refresh tasks after updating the status
    } catch (error) {
      console.error('Error updating task status: ', error.message); // Handle errors in updating status
    }
  };

  const toggleFavoriteStatus = async (taskid, currentFavorite) => {
    const favorite = currentFavorite === null || currentFavorite === undefined ? 0 : currentFavorite; // Handle null or undefined favorite status
    const newFavorite = favorite === 0 ? 1 : 0; // Toggle favorite status between 0 and 1
    try {
      await updateFavoriteStatus(taskid, newFavorite); // Update favorite status in the database
      fetchTasks(); // Refresh tasks after updating the favorite status
    } catch (error) {
      console.error('Error updating favorite status: ', error.message); // Handle errors in updating favorite status
    }
  };

  const parseDate = (dateString) => {
    const monthMap = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };

    const match = dateString.match(/([a-zA-Z]+) (\d+)(st|nd|rd|th), (\d{4})/);
    if (!match) return new Date(NaN); // Return invalid date if format doesn't match

    const [, monthName, day, , year] = match;
    const month = monthMap[monthName];
    const dayNumber = parseInt(day, 10);

    return new Date(year, month, dayNumber);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = parseDate(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const renderTask = ({ item }) => {
    const hasDueDateOrAlarm = item.duedate || item.alarm;
    const isCompleted = item.donestatus === 1;
    const taskIcon = isCompleted ? 'checkmark-circle-outline' : 'ellipse-outline';
    const favoriteIcon = item.favorite === 1 ? 'star' : 'star-outline';
    const overdue = isOverdue(item.duedate);

    return (
      <TouchableOpacity>
        <View style={[styles.taskContainer, hasDueDateOrAlarm && styles.taskContainerWithDetails]}>
          <View style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleTaskStatus(item.taskid, item.donestatus)}>
              <Ionicons name={taskIcon} style={styles.taskCircle} size={30} color={isCompleted ? '#007CBB' : 'black'} />
            </TouchableOpacity>
            <View style={styles.taskTextContainer}>
              <Text style={[styles.taskText, isCompleted && styles.completedTaskText]}>
                {item.tasktext}
              </Text>

              {(item.duedate || item.alarm || item.repeatstatus || item.description) && (
                <View style={styles.detailsRow}>
                  {item.duedate && (
                    <View style={styles.iconWithText}>
                      <Ionicons name="calendar-outline" size={16} color="gray" />
                      <Text style={[styles.iconText, overdue && styles.overdueDate]}>{item.duedate}</Text>
                    </View>
                  )}
                  {item.alarm && (
                    <View style={styles.iconWithText}>
                      <Ionicons name="alarm-outline" size={16} color="gray" />
                    </View>
                  )}
                  {item.repeatstatus && (
                    <View style={styles.iconWithText}>
                      <Ionicons name="repeat-outline" size={16} color="gray" />
                    </View>
                  )}
                  {item.description && (
                    <View style={styles.iconWithText}>
                      <Ionicons name="document-outline" size={16} color="gray" />
                    </View>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity onPress={() => toggleFavoriteStatus(item.taskid, item.favorite)}>
              <Ionicons name={favoriteIcon} size={24} color={item.favorite === 1 ? 'gold' : 'black'} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#007CBB' },
          ...tasks.reduce((acc, task) => {
            const formattedDate = format(parse(task.duedate, 'MMMM do, yyyy', new Date()), 'yyyy-MM-dd');
            acc[formattedDate] = { marked: true, dotColor: 'red' };
            return acc;
          }, {}),
        }}
        theme={{
          selectedDayBackgroundColor: '#007CBB',
          todayTextColor: '#007CBB',
          arrowColor: 'black',
          monthTextColor: 'black',
          textSectionTitleColor: 'black',
          dayTextColor: 'black',
        }}
        style={styles.calendar}
      />
      {tasksForSelectedDate.length > 0 ? (
        <FlatList
          data={tasksForSelectedDate}
          keyExtractor={(item) => item.taskid.toString()}
          renderItem={renderTask}
          style={styles.taskList}
        />
      ) : (
        <Text style={styles.noTasksText}>No tasks for this date</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  taskList: {
    marginTop: 10,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  noTasksText: {
    padding: 20,
    textAlign: 'center',
    color: 'gray',
  },
  taskContainerWithDetails: {
    height: 70, 
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCircle: {
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  taskTextContainer: {
    flex: 1,

  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  iconWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    marginLeft: 5,
    fontSize: 14,
    color: 'gray',
  },
  overdueDate: {
    color: '#F34B4B',
  },
  completedTaskText: {
    textDecorationLine: 'line-through', 
    color: 'gray',
  },
});

export default CalendarScreen;
