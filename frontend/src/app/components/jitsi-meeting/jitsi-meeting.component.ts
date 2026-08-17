import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JitsiScriptService } from '../../services/jitsi-script.service';

declare var JitsiMeetExternalAPI: any;

export type JitsiMeetingStatus = 'IDLE' | 'LOADING' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR';

@Component({
  selector: 'app-jitsi-meeting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jitsi-meeting.component.html',
  styleUrls: ['./jitsi-meeting.component.scss']
})
export class JitsiMeetingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('jitsiContainer', { static: false }) jitsiContainer!: ElementRef<HTMLDivElement>;

  @Input() roomName = 'mentorhub-live-workspace';
  @Input() displayName = 'AKSHAT ARYAN (Mentor)';
  @Input() email = 'akshat@mentorhub.com';
  @Input() role: 'MENTOR' | 'MENTEE' = 'MENTOR';
  @Input() autoJoin = false;

  @Output() meetingJoined = new EventEmitter<void>();
  @Output() participantJoined = new EventEmitter<any>();
  @Output() participantLeft = new EventEmitter<any>();
  @Output() meetingEnded = new EventEmitter<void>();
  @Output() audioMuteChanged = new EventEmitter<boolean>();
  @Output() videoMuteChanged = new EventEmitter<boolean>();
  @Output() screenShareChanged = new EventEmitter<boolean>();
  @Output() statusChanged = new EventEmitter<JitsiMeetingStatus>();

  status: JitsiMeetingStatus = 'IDLE';
  errorMessage = '';
  isAudioMuted = true;
  isVideoMuted = true;
  isSharingScreen = false;
  isTileView = true;
  participantCount = 1;
  isUnsecureContext = false;
  currentHost = '';

  private jitsiApi: any = null;

  constructor(private jitsiScriptService: JitsiScriptService) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.currentHost = location.host;
    }
  }

  ngAfterViewInit() {
    if (this.autoJoin) {
      setTimeout(() => {
        this.initMeeting();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.disposeMeeting();
  }

  async initMeeting() {
    if (this.status === 'CONNECTED' || this.jitsiApi) return;

    if (typeof window !== 'undefined') {
      this.currentHost = location.host;
      if (location.protocol === 'http:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          this.isUnsecureContext = true;
          this.setStatus('ERROR');
          return;
        }
      }
    }

    this.setStatus('LOADING');
    this.errorMessage = '';

    try {
      await this.jitsiScriptService.loadJitsiScript();

      if (!this.jitsiContainer || !this.jitsiContainer.nativeElement) {
        console.warn('Jitsi container element not found in DOM yet.');
        return;
      }

      this.setStatus('CONNECTING');

      const domain = 'meet.jit.si';
      const containerNode = this.jitsiContainer.nativeElement;
      containerNode.innerHTML = '';

      const options = {
        roomName: this.roomName,
        width: '100%',
        height: '100%',
        parentNode: containerNode,
        userInfo: {
          displayName: this.displayName,
          email: this.email
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          enableNoisyMicDetection: true,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat', 'raisehand',
            'reactions', 'participants-pane', 'tileview', 'fullscreen', 'settings', 'hangup'
          ]
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_BACKGROUND: '#040711',
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false
        }
      };

      this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
      this.attachJitsiEvents();

      // Fallback connected status if Jitsi videoConferenceJoined fires fast
      setTimeout(() => {
        if (this.status === 'CONNECTING' && this.jitsiApi) {
          this.setStatus('CONNECTED');
          this.meetingJoined.emit();
        }
      }, 1500);

    } catch (err: any) {
      console.error('Failed to initialize Jitsi Meet IFrame:', err);
      this.setStatus('ERROR');
      this.errorMessage = 'Unable to connect to Jitsi Video Service. Please check camera/mic permissions and retry.';
    }
  }

  private attachJitsiEvents() {
    if (!this.jitsiApi) return;

    this.jitsiApi.addEventListener('videoConferenceJoined', (data: any) => {
      this.setStatus('CONNECTED');
      this.meetingJoined.emit();
    });

    this.jitsiApi.addEventListener('videoConferenceLeft', () => {
      this.setStatus('DISCONNECTED');
      this.meetingEnded.emit();
    });

    this.jitsiApi.addEventListener('participantJoined', (data: any) => {
      this.participantCount++;
      this.participantJoined.emit(data);
    });

    this.jitsiApi.addEventListener('participantLeft', (data: any) => {
      this.participantCount = Math.max(1, this.participantCount - 1);
      this.participantLeft.emit(data);
    });

    this.jitsiApi.addEventListener('audioMuteStatusChanged', (data: any) => {
      this.isAudioMuted = data.muted;
      this.audioMuteChanged.emit(this.isAudioMuted);
    });

    this.jitsiApi.addEventListener('videoMuteStatusChanged', (data: any) => {
      this.isVideoMuted = data.muted;
      this.videoMuteChanged.emit(this.isVideoMuted);
    });

    this.jitsiApi.addEventListener('screenSharingStatusChanged', (data: any) => {
      this.isSharingScreen = data.on;
      this.screenShareChanged.emit(this.isSharingScreen);
    });

    this.jitsiApi.addEventListener('readyToClose', () => {
      this.setStatus('DISCONNECTED');
      this.meetingEnded.emit();
    });
  }

  toggleAudio() {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleAudio');
    }
  }

  toggleVideo() {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleVideo');
    }
  }

  toggleShareScreen() {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleShareScreen');
    }
  }

  toggleTileView() {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('toggleTileView');
      this.isTileView = !this.isTileView;
    }
  }

  toggleFullscreen() {
    if (this.jitsiContainer && this.jitsiContainer.nativeElement) {
      const elem = this.jitsiContainer.nativeElement;
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => console.log('Fullscreen request failed:', err));
      } else {
        document.exitFullscreen();
      }
    }
  }

  hangup() {
    if (this.jitsiApi) {
      this.jitsiApi.executeCommand('hangup');
    }
  }

  disposeMeeting() {
    if (this.jitsiApi) {
      try {
        this.jitsiApi.dispose();
      } catch (e) {
        console.log('Error disposing Jitsi API:', e);
      }
      this.jitsiApi = null;
    }
    this.setStatus('IDLE');
  }

  retryConnection() {
    this.disposeMeeting();
    this.initMeeting();
  }

  private setStatus(newStatus: JitsiMeetingStatus) {
    this.status = newStatus;
    this.statusChanged.emit(this.status);
  }
}
