/**
 * Service de notifications push pour PRISK
 * Utilise Capacitor LocalNotifications pour afficher des notifications locales
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationData {
  title: string;
  body: string;
  id?: number;
  extra?: any;
}

class PushNotificationService {
  private isInitialized = false;
  private lastNotificationId = 0;

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Notifications: Mode web - notifications locales désactivées');
      return;
    }

    try {
      // Demander la permission pour les notifications
      const permissionStatus = await LocalNotifications.checkPermissions();
      
      if (permissionStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.warn('⚠️ Permission de notification refusée');
          return;
        }
      }

      this.isInitialized = true;
      console.log('✅ Service de notifications initialisé');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  /**
   * Envoie une notification locale
   */
  async sendNotification(data: NotificationData): Promise<void> {
    if (!this.isInitialized && Capacitor.isNativePlatform()) {
      await this.initialize();
    }

    if (!Capacitor.isNativePlatform()) {
      // En mode web, utiliser les notifications du navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.body,
          icon: '/icon.png',
          badge: '/icon.png',
        });
      }
      return;
    }

    try {
      this.lastNotificationId += 1;
      const notificationId = data.id || this.lastNotificationId;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: data.title,
            body: data.body,
            id: notificationId,
            schedule: { at: new Date(Date.now() + 1000) }, // Notification immédiate
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: data.extra || {},
            // Options Android spécifiques
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#00843D',
            // Vibration pour les alertes critiques
            ...(data.extra?.critical && {
              vibration: true,
            }),
          },
        ],
      });

      console.log(`📬 Notification envoyée: ${data.title}`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    }
  }

  /**
   * Envoie une notification d'alerte critique avec vibration
   */
  async sendCriticalAlert(alert: {
    id: string;
    lineName: string;
    message: string;
    riskScore?: number;
  }): Promise<void> {
    const title = `🚨 Alerte Critique - ${alert.lineName}`;
    const body = alert.message || `Risque élevé détecté sur la ligne ${alert.lineName}`;

    await this.sendNotification({
      title,
      body,
      extra: {
        critical: true,
        alertId: alert.id,
        lineName: alert.lineName,
        riskScore: alert.riskScore,
        type: 'critical_alert',
      },
    });
  }

  /**
   * Annule toutes les notifications en attente
   */
  async cancelAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({
        notifications: [],
      });
      console.log('🗑️ Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des notifications:', error);
    }
  }

  /**
   * Vérifie si les notifications sont disponibles
   */
  isAvailable(): boolean {
    return Capacitor.isNativePlatform() || 'Notification' in window;
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();


