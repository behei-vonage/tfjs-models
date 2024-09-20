/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as params from './params';
import {isMobile} from './util';
import OT from '@opentok/client';

export class Camera {
  constructor() {
    this.video = document.getElementById('video');
  }

  /**
   * Initiate a Camera instance and wait for the camera stream to be ready.
   * @param cameraParam From app `STATE.camera`.
   */
  static async setup(cameraParam) {
    let session;
    let apiKey;
    let sessionId;
    let token;
    let streamId; 
    session = OT.initSession(apiKey, sessionId);

    // Subscribe to a newly created stream
    session.on('streamCreated', function streamCreated(event) {
    var subscriberOptions = {
      insertDefaultUI: false,
      insertMode: 'append',
      width: '100%',
      height: '100%'
    };
    var subscriber = session.subscribe(event.stream, 'subscriber', subscriberOptions);
    subscribers[subscriber.streamId] = subscriber;
    });

    session.on('sessionDisconnected', function sessionDisconnected(event) {
      console.log('You were disconnected from the session.', event.reason);
    });

    // initialize the publisher
    var publisherOptions = {
      insertDefaultUI: false,
      name: 'Publisher',
      publishAudio: true,
      publishVideo: true,
    };
    var publisher = OT.initPublisher('publisher', publisherOptions);

    // Connect to the session
    session.connect(token, function callback(error) {
      if (error) {
        console.warn(error);
      } else {
        // If the connection is successful, publish the publisher to the session
        session.publish(publisher, async (err) => {
          if (err) {
            console.log('Error', err);
          } else {
            publisher.on('mediaStreamAvailable', (mediaStream) => {
              console.warn('mediaStreamAvailable');
              const {targetFPS, sizeOption} = cameraParam;
              const $size = params.VIDEO_SIZE[sizeOption];
              const videoConfig = {
                'audio': false,
                'video': {
                  facingMode: 'user',
                  // Only setting the video to a specified size for large screen, on
                  // mobile devices accept the default size.
                  width: isMobile() ? params.VIDEO_SIZE['360 X 270'].width : $size.width,
                  height: isMobile() ? params.VIDEO_SIZE['360 X 270'].height :
                                      $size.height,
                  frameRate: {
                    ideal: targetFPS,
                  }
                }
              };

              const stream = mediaStream;

              const camera = new Camera();
              camera.video.srcObject = stream;
              const videoWidth = camera.video.videoWidth;
              const videoHeight = camera.video.videoHeight;
              // Must set below two lines, otherwise video element doesn't show.
              camera.video.width = videoWidth;
              camera.video.height = videoHeight;

              const canvasContainer = document.querySelector('.canvas-wrapper');
              canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

              return camera;
            })
          }
        });
      }
    });
  }
}
