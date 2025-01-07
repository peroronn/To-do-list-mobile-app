import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal, Button, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import TaskInputModal from '../TaskInputModal';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getTasks, updateTaskStatus, updateFavoriteStatus, resetDailyTasks, resetWeeklyTasks, resetMonthlyTasks } from '../database';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { parse } from 'date-fns';

const Tasks = () => {
  const [modalVisible, setModalVisible] = useState(false); // State to control visibility of the task input modal
  const [tasks, setTasks] = useState([]); // State to store the list of tasks
  const [expanded, setExpanded] = useState(true); // State to toggle expansion of the incomplete tasks section
  const [expandedCompleted, setExpandedCompleted] = useState(true); // State to toggle expansion of the completed tasks section
  const [isSortPanelVisible, setSortPanelVisible] = useState(false); // State to control visibility of the sort panel
  const navigation = useNavigation(); // Hook to access navigation object
  const isFocused = useIsFocused(); // Hook to check if the screen is currently focused

  // useEffect hook to fetch tasks whenever the screen is focused
  useEffect(() => {
    if (isFocused) {
      fetchTasks(); // Fetch tasks from the database
    }
  }, [isFocused]);

  // Function to fetch tasks and reset daily, weekly, and monthly tasks
  const fetchTasks = async () => {
    try {
      await resetDailyTasks();  // Reset daily tasks before fetching
      await resetWeeklyTasks(); // Reset weekly tasks
      await resetMonthlyTasks(); // Reset monthly tasks
      const taskList = await getTasks(); // Fetch tasks from the database
      setTasks(taskList); // Update the state with the fetched tasks
    } catch (error) {
      console.error('Error fetching tasks: ', error.message); // Log any error that occurs during fetching
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

  // Function to check if a task is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false; // If no due date, it's not overdue

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    const taskDate = parseDate(dueDate); // Parse the task's due date
    taskDate.setHours(0, 0, 0, 0); // Set time to midnight for comparison
    return taskDate < today; // Return true if task is overdue
  };

  // Function to toggle the status of a task (complete/incomplete)
  const toggleTaskStatus = async (taskid, currentStatus) => {
    const status = currentStatus === null ? 0 : currentStatus; // Default to 0 if status is null
    const newStatus = status === 0 ? 1 : 0; // Toggle status between 0 and 1
    try {
      await updateTaskStatus(taskid, newStatus); // Update the task status in the database
      fetchTasks(); // Refresh tasks after updating the status
    } catch (error) {
      console.error('Error updating task status: ', error.message); // Log any error that occurs during updating
    }
  };

  // Function to toggle the favorite status of a task
  const toggleFavoriteStatus = async (taskid, currentFavorite) => {
    const favorite = currentFavorite === null || currentFavorite === undefined ? 0 : currentFavorite; // Default to 0 if favorite is null or undefined
    const newFavorite = favorite === 0 ? 1 : 0; // Toggle favorite status between 0 and 1
    try {
      await updateFavoriteStatus(taskid, newFavorite); // Update the favorite status in the database
      fetchTasks(); // Refresh tasks after updating the favorite status
    } catch (error) {
      console.error('Error updating favorite status: ', error.message); // Log any error that occurs during updating
    }
  };

  // Function to handle the saving of a task
  const handleSaveTask = (taskText, dueDate, reminderTime) => {
    fetchTasks(); // Refresh tasks after saving
    setModalVisible(false); // Close the task input modal
  };

  // Function to toggle the expansion of the incomplete tasks section
  const toggleExpand = () => {
    setExpanded(!expanded); // Toggle the expanded state
  };

  // Function to toggle the expansion of the completed tasks section
  const toggleExpandCompleted = () => {
    setExpandedCompleted(!expandedCompleted); // Toggle the expandedCompleted state
  };

  // Function to toggle the visibility of the sort panel
  const toggleSortPanel = () => {
    setSortPanelVisible(!isSortPanelVisible); // Toggle the sort panel visibility
  };

  // Function to handle clicking outside the modal
  const handleOutsidePress = () => {
    setSortPanelVisible(false); // Close the sort panel
  };
  

  // Function to sort tasks by date or favorite
  const sortTasks = (type) => {
    if (type === 'date') {
      fetchTasks(); // Sort by date (default order)
    } else if (type === 'favorite') {
      setTasks([...tasks].sort((a, b) => b.favorite - a.favorite)); // Sort by favorite status
    }
    toggleSortPanel(); // Close the sort panel after sorting
  };
  // Filter tasks into incomplete and completed categories
  const incompleteTasks = tasks.filter(task => task.donestatus === 0);
  const completedTasks = tasks.filter(task => task.donestatus === 1);

  const renderTask = ({ item }) => {
    const hasDueDateOrAlarm = item.duedate || item.alarm; // Check if task has due date or alarm
    const isCompleted = item.donestatus === 1; // Check if task is completed
    const taskIcon = isCompleted ? 'checkmark-circle-outline' : 'ellipse-outline'; // Set icon based on completion status
    const favoriteIcon = item.favorite === 1 ? 'star' : 'star-outline'; // Set icon based on favorite status
    const overdue = isOverdue(item.duedate); // Check if task is overdue

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EditTask', {
          taskid: item.taskid,
          tasktext: item.tasktext,
          duedate: item.duedate,
          alarm: item.alarm,
          donestatus: item.donestatus,
          favorite: item.favorite,
          description: item.description,
          repeatstatus: item.repeatstatus,
        })}
      >
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
      {/* Title Bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleBarText}>Tasks</Text>
        <TouchableOpacity  onPress={toggleSortPanel}>
          <Ionicons name="filter-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {/* Sort Panel Modal */}
        <Modal
          visible={isSortPanelVisible}
          transparent={true}
          onRequestClose={toggleSortPanel}
        >
          <TouchableWithoutFeedback onPress={handleOutsidePress}>
            <View style={styles.modalContainer}>
              <View style={styles.sortPanel}>
                <Text style={styles.sortTitle}>Sort By:</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => sortTasks('date')}
                >
                  <Text style={styles.sortButtonText}>Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => sortTasks('favorite')}
                >
                  <Text style={styles.sortButtonText}>Favorite</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
      <ScrollView>
        <View style={styles.taskListContainer}>
          {/* Incomplete Tasks Section */}
          {incompleteTasks.length > 0 && (
            <View>
              <TouchableOpacity style={styles.titleRow} onPress={toggleExpand}>
                <Text style={styles.title}>Tasks</Text>
                <Ionicons name={expanded ? "chevron-up-outline" : "chevron-down-outline"} size={24} color="black" />
              </TouchableOpacity>
              {expanded && (
                <FlatList
                  data={incompleteTasks}
                  keyExtractor={(item) => item.taskid.toString()}
                  renderItem={renderTask}
                />
              )}
            </View>
          )}

          {/* Completed Tasks Section */}
          {completedTasks.length > 0 && (
            <View>
              <TouchableOpacity style={styles.completedtitleRow} onPress={toggleExpandCompleted}>
                <Text style={styles.title}>Completed</Text>
                <Ionicons name={expandedCompleted ? "chevron-up-outline" : "chevron-down-outline"} size={24} color="black" />
              </TouchableOpacity>
              {expandedCompleted && (
                <FlatList
                  data={completedTasks}
                  keyExtractor={(item) => item.taskid.toString()}
                  renderItem={renderTask}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
      <TaskInputModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveTask}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end', 
    backgroundColor: 'rgba(0, 0, 0, 0.001)', 
  },
   sortPanel: {
    position: 'absolute', 
    top: 50, 
    right: 20, 
    width: 130,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, 
  },
  sortTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sortButton: {
    width: '100%', 
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#007CBB',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 16,
  },
  taskListContainer: {
    flex: 1,
    padding: 18,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    position: 'relative', 
  },
  titleBarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  completedtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 5,
    borderColor: 'gray',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
    padding: 10,
    height: 70, 
    backgroundColor: 'white',
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
  taskText: {
    fontSize: 16,
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
    color: '#F34B4B', // Highlight overdue dates in red
  },
  completedTaskText: {
    textDecorationLine: 'line-through', 
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007CBB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Tasks;