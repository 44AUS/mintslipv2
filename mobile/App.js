import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  BackHandler,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';

const MINTSLIP_URL = 'https://mintslip.com';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: MINTSLIP_URL }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        cacheEnabled={true}
        pullToRefreshEnabled={true}
        // Allow file downloads
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        // Handle external links
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          // Allow all requests to mintslip.com
          if (request.url.includes('mintslip.com') || 
              request.url.includes('stripe.com') ||
              request.url.startsWith('blob:') ||
              request.url.startsWith('data:')) {
            return true;
          }
          return true;
        }}
        // Inject JavaScript to handle downloads
        injectedJavaScript={`
          // Prevent zooming issues
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
          document.getElementsByTagName('head')[0].appendChild(meta);
          true;
        `}
        onMessage={(event) => {
          // Handle messages from the web page if needed
          console.log('WebView message:', event.nativeEvent.data);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
        renderError={(errorName) => (
          <View style={styles.errorContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
