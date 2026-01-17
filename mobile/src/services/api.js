// API Service for MintSlip Mobile
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://ai-blog-image-fix.preview.emergentagent.com/api';

class ApiService {
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('@mintslip_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('@mintslip_token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  async removeAuthToken() {
    try {
      await AsyncStorage.removeItem('@mintslip_token');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  async getUserInfo() {
    try {
      const userInfo = await AsyncStorage.getItem('@mintslip_user');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  async setUserInfo(user) {
    try {
      await AsyncStorage.setItem('@mintslip_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user info:', error);
    }
  }

  async removeUserInfo() {
    try {
      await AsyncStorage.removeItem('@mintslip_user');
    } catch (error) {
      console.error('Error removing user info:', error);
    }
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.token) {
      await this.setAuthToken(data.token);
      await this.setUserInfo(data.user);
    }

    return data;
  }

  async signup(name, email, password, saveDocuments = false) {
    const data = await this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, saveDocuments }),
    });

    if (data.token) {
      await this.setAuthToken(data.token);
      await this.setUserInfo(data.user);
    }

    return data;
  }

  async logout() {
    await this.removeAuthToken();
    await this.removeUserInfo();
  }

  async getCurrentUser() {
    return this.request('/user/me');
  }

  async forgotPassword(email) {
    return this.request('/user/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Subscription download
  async subscriptionDownload(documentType, template, count) {
    return this.request('/user/subscription-download', {
      method: 'POST',
      body: JSON.stringify({ documentType, template, count }),
    });
  }

  // Stripe checkout
  async createOneTimeCheckout(params) {
    return this.request('/stripe/create-one-time-checkout', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Track purchase
  async trackPurchase(purchaseData) {
    return this.request('/purchases/track', {
      method: 'POST',
      body: JSON.stringify(purchaseData),
    });
  }

  // Validate coupon
  async validateCoupon(code, documentType) {
    return this.request('/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ code, documentType }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
