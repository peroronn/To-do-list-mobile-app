import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native'; 
import Tasks from './components/screens/Tasks';
import EditTaskScreen from './components/screens/Edit';
import Calendar from './components/screens/Calendar';
import Profile from './components/screens/Profile';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createTables, getTasks, getTasksCount } from './components/database';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { parse, format } from 'date-fns'; 

// Define the navigators for the app
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Set up notification handler to control notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Display an alert when a notification is received
    shouldPlaySound: false, // No sound for notifications
    shouldSetBadge: true,   // Set a badge on the app icon
  }),
});

// Function to parse alarm time from a string to a Date object
const parseAlarmTime = (alarmTime) => {
  return parse(alarmTime, 'h:mm a', new Date());
};

// Function to get the current time in 'h:mm a' format
const getCurrentTime = () => {
  return format(new Date(), 'h:mm a');
};

// Function to check if any tasks have alarms set for the current time and trigger notifications
const checkAlarms = async () => {
  const tasks = await getTasks(); // Fetch all tasks from the database
  const currentTime = getCurrentTime(); // Get the current time

  tasks.forEach((task) => {
    // Check if the task has an alarm set and if it is not marked as done
    if (task.alarm && task.donestatus === 0) {
      const alarmTime = parseAlarmTime(task.alarm); // Parse the alarm time
      const alarmTimeString = format(alarmTime, 'h:mm a'); // Format the parsed time

      // If the alarm time matches the current time, trigger a notification
      if (alarmTimeString === currentTime) {
        schedulePushNotification(task); 
      }
    }
  });
};

// Function to check the number of tasks and notify the user if there are overdue tasks
const checkTaskCountAndNotify = async () => {
  const taskCount = await getTasksCount(); // Get the total number of tasks

  // If there are tasks overdue, notify the user
  if (taskCount > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `You have ${taskCount} overdue tasks. Please check them!`,
        sound: 'default', // Set the notification sound
      },
      trigger: { seconds: 1 }, // Trigger the notification after 1 second
    });
  }
};

// Stack navigator for the Tasks screen, including the EditTaskScreen
function TasksStack() {
  return (
    <Stack.Navigator initialRouteName="EditTaskScreen">
      <Stack.Screen
        name="Tasks"
        component={Tasks}
        options={{ headerShown: false }} // Hide the header on the Tasks screen
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{
          title: 'Edit Task', 
          headerShown: true, // Show the header on the EditTask screen
        }}
      />
    </Stack.Navigator>
  );
}

// Main App component
export default function App() {
  useEffect(() => {
    createTables(); // Initialize the database tables when the app loads
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      checkTaskCountAndNotify(); // Periodically check for overdue tasks and notify the user
    }, 86400000); // Check once a day (86400000 ms = 24 hours)

    return () => clearInterval(interval); // Clear the interval when the component unmounts
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAlarms(); // Periodically check if any task alarms need to trigger notifications
    }, 60000); // Check every minute (60000 ms = 1 minute)

    return () => clearInterval(interval); // Clear the interval when the component unmounts
  }, []);

  // State variables to manage push notifications
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register the device for push notifications
    registerForPushNotificationsAsync().then((token) => setExpoPushToken(token));

    // Listen for notifications that are received
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for user interaction with the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    // Cleanup the notification listeners when the component unmounts
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Tasks"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color }) => {
            let iconName;
            // Set different icons for each tab
            if (route.name === 'Tasks') {
              iconName = 'checkmark-circle-outline';
            } else if (route.name === 'Calendar') {
              iconName = 'calendar-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }
            return <Ionicons name={iconName} size={30} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: '#007CBB', // Color for the active tab
          inactiveTintColor: 'gray',  // Color for the inactive tabs
        }}
      >
        <Tab.Screen name="Tasks" options={{ headerShown: false }} component={TasksStack} />
        <Tab.Screen name="Calendar" component={Calendar} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Function to schedule a push notification for a task
async function schedulePushNotification(task) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder', // Notification title
      body: `It's time for: ${task.tasktext}`, // Notification body text
      sound: 'default', // Set the notification sound
    },
    trigger: { seconds: 1 }, // Trigger the notification after 1 second
  });
  console.log('Notification scheduled for task:', task.tasktext);
}

// Function to register the device for push notifications
async function registerForPushNotificationsAsync() {
  let token;

  // Configure notifications for Android devices
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], // Vibration pattern
      lightColor: '#FF231F7C', // Notification light color
    });
  }

  // Check if the device is physical (not an emulator)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    // If permissions are still not granted, show an alert
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Get the Expo push token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}
