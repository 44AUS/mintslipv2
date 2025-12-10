import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

const PAYPAL_CLIENT_ID = 'AaLPbPlOPPIiSXdlRvDbBUX8oxahW_7R-csGaJvS0TNA2AwDYxMNi3l2hAtW_5KonXhIoC6YasnjJlqx';

export default function PayPalWebView({ visible, amount, description, onSuccess, onError, onCancel }) {
  const [loading, setLoading] = useState(true);

  const paypalHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        }
        #paypal-button-container {
          margin-top: 20px;
        }
        .info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #1a4731;
          margin-bottom: 10px;
        }
        .description {
          font-size: 16px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="info">
        <div class="amount">$${amount.toFixed(2)}</div>
        <div class="description">${description}</div>
      </div>
      <div id="paypal-button-container"></div>
      
      <script>
        paypal.Buttons({
          createOrder: function(data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: '${amount.toFixed(2)}',
                  currency_code: 'USD'
                },
                description: '${description}'
              }]
            });
          },
          onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: details
              }));
            });
          },
          onError: function(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: err.message || 'Payment failed'
            }));
          },
          onCancel: function(data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'cancel'
            }));
          }
        }).render('#paypal-button-container');
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'success') {
        onSuccess(message.data);
      } else if (message.type === 'error') {
        onError(message.error);
      } else if (message.type === 'cancel') {
        onCancel();
      }
    } catch (error) {
      console.error('Error parsing PayPal message:', error);
      onError('Payment processing error');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a4731" />
            <Text style={styles.loadingText}>Loading PayPal...</Text>
          </View>
        )}
        
        <WebView
          source={{ html: paypalHTML }}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1a4731',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 24,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  webview: {
    flex: 1,
  },
});
