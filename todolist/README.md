Running the App with Expo v50.0.0

    #Download Expo Go:
        First, install the Expo Go app on your phone from your app store.

    Run the App:
        If you have the latest version, scan the QR code that appears in your browser when you run the project.

    Switch to Expo v50.0.0:
        If the project is set up for Expo v51.0.0 by default, make sure to switch to version v50.0.0 in your Expo Go app after scanning the QR code.

This will allow you to run the app smoothly with the appropriate Expo version.


## Running the Project Locally with Visual Studio Code and Node.js

    Install Expo CLI:

    npm install -g expo-cli

Create a New Expo Project:

    npx create-expo-app todolistapp

    cd todolistapp

Copy Your Files:

    Replace the contents of the App.js file and components folder in the new project with your existing code from the Snack environment.
    Replace the package.json file in the new project with the one you provided.

Install Dependencies:

    npm install
    npm install expo-router

Start the Project:

    npx expo start

Setting Up for Web Hosting

To prepare your project for web hosting, install the following additional dependencies:

    npx expo install react-native-web react-dom