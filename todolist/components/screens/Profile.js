import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as SQLite from 'expo-sqlite';

// Complete the auth session if redirected back from the browser
WebBrowser.maybeCompleteAuthSession();

const Profile = () => {
  const [user, setUser] = useState(null); // State to store user information

  const redirectUri = makeRedirectUri({
    useProxy: true, // This is typically true when using Expo Go
  });
  // Setup Google authentication request
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '1016870477574-3om0tpj825to8h1bd41fqq2lvfbocfa0.apps.googleusercontent.com',
    redirectUri,
  });
  console.log("Redirect URI:", redirectUri);

  // Effect to handle the authentication response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication.accessToken}` },
      })
        .then((response) => response.json())
        .then((data) => {
          setUser(data);
          // Store user info in SQLite database
          db.transaction(tx => {
            tx.executeSql(
              'INSERT OR REPLACE INTO users (email, displayName, googleId, accessToken, refreshToken, lastSync) VALUES (?, ?, ?, ?, ?, ?)',
              [
                data.email,
                data.name,
                data.id,
                authentication.accessToken,
                authentication.refreshToken || '',  
                new Date().toISOString()
              ],
              (_, result) => {
                console.log('User info stored in database:', result);
              },
              (_, error) => {
                console.error('Error storing user info:', error);
              }
            );
          });
        })
        .catch((error) => {
          Alert.alert('Error', 'Failed to fetch user info');
        });
    }
  }, [response]);
  // Function to handle sign-out
  const handleSignOut = () => {
    setUser(null);
    if (user) {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM users WHERE googleId = ?',
          [user.id],
          (_, result) => {
            console.log('User info removed from database:', result);
          },
          (_, error) => {
            console.error('Error removing user info:', error);
          }
        );
      });
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.label}>Welcome, {user.name}</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => promptAsync()}
          >
            <Ionicons name="logo-google" size={20} color="white" />
            <Text style={styles.loginButtonText}> Login with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              WebBrowser.openBrowserAsync('https://accounts.google.com/signup')
            }
          >
            <Text style={styles.registerText}>
              Don't have a Google account? Register
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007CBB',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  signOutButton: {
    marginTop: 40,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FF6347',
  },
  signOutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerText: {
    color: '#007CBB',
    fontSize: 16,
    marginTop: 20,
  },
});

export default Profile;
