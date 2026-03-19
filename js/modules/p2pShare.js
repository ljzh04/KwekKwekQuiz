/**
 * @fileoverview P2P Sharing module for KwekKwekQuiz
 * Handles peer-to-peer sharing of quizzes using WebRTC technology.
 * @module p2pShare
 * @author KwekKwekQuiz Team
 * @version 1.0.0
 */

import * as DOM from './dom.js';
import { showError, clearError, showSuccess, showInfo } from './utils.js';
import { validateQuizData } from './utils.js';

/**
 * @type {Peer | null}
 * @private
 * @description Global PeerJS instance
 */
let peer = null;

/**
 * @type {DataConnection | null}
 * @private
 * @description Current active connection
 */
let currentConnection = null;

/**
 * @type {boolean}
 * @private
 * @description Flag indicating if the peer is listening for connections
 */
let isListening = false;

/**
 * @type {any}
 * @private
 * @description Data received from a peer
 */
let receivedData = null;

/**
 * Generate a short 4-6 character alphanumeric ID
 * @function generateShortId
 * @param {number} [length=5] - Length of the ID to generate
 * @returns {string} Generated short ID
 * @private
 * @todo Add validation to ensure generated IDs are unique within the network
 * @toimprove Use cryptographically secure random generation
 * @tofix Ensure consistent character set across all instances
 */
function generateShortId(length = 5) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Initialize PeerJS connection
 * @function initializePeer
 * @returns {Peer | null} The initialized Peer instance or null if failed
 * @todo Add error handling for PeerJS initialization failures
 * @toimprove Implement retry mechanism for connection failures
 * @tofix Ensure proper cleanup of previous peer connections
 */
export function initializePeer() {
    if (typeof Peer === 'undefined') {
        console.error('PeerJS not loaded');
        return null;
    }

    const shortId = generateShortId();
    peer = new Peer(shortId, {
        debug: 2
    });

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        if (DOM.myPeerId) {
            DOM.myPeerId.textContent = id;
        }
    });

    peer.on('connection', (conn) => {
        console.log('Incoming connection from:', conn.peer);
        handleIncomingConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        let errorMsg = 'Connection error';
        if (err.type === 'peer-unavailable') {
            errorMsg = 'Peer not found or offline';
        } else if (err.type === 'network') {
            errorMsg = 'Network error - check internet connection';
        } else if (err.type === 'disconnected') {
            errorMsg = 'Disconnected from peer';
        }
        showError(errorMsg);
        updateStatus(errorMsg, 'error');
    });

    peer.on('disconnected', () => {
        console.log('Disconnected from peer');
        updateStatus('Disconnected', 'warning');
    });

    return peer;
}

/**
 * Handle incoming connection (when someone sends data to us)
 * @function handleIncomingConnection
 * @param {DataConnection} conn - The incoming connection
 * @returns {void}
 * @private
 * @todo Add validation for incoming data format
 * @toimprove Implement data encryption for security
 * @tofix Ensure proper cleanup of previous connections
 */
function handleIncomingConnection(conn) {
    if (currentConnection) {
        conn.close();
        return;
    }

    currentConnection = conn;
    updateStatus('Connected! Receiving...', 'success');

    conn.on('data', (data) => {
        console.log('Received message:', data);

        if (data.type === 'request') {
            const quizData = JSON.parse(DOM.quizJsonInput.value || "{}");

            if (validateQuizData(quizData)) {
                updateStatus('Sending quiz to peer...', 'info');
                conn.send(quizData);
            } else {
                conn.send({ type: 'error', message: 'Sender has no valid quiz loaded' });
            }
            return;
        }

        receivedData = data;
        if (validateQuizData(data)) {
            updateStatus('Quiz received successfully!', 'success');
            displayReceivedJson(data);
        }
    });

    conn.on('close', () => {
        console.log('Connection closed');
        currentConnection = null;
        if (isListening) {
            updateStatus('Waiting for next receiver...', 'info');
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        updateStatus('Connection error', 'error');
        currentConnection = null;
    });
}

/**
 * Display received JSON in the download modal preview
 * @function displayReceivedJson
 * @param {any} data - The received data to display
 * @returns {void}
 * @private
 * @todo Add syntax highlighting for the JSON display
 * @toimprove Implement collapsible sections for large JSON objects
 * @tofix Ensure proper escaping of special characters in JSON
 */
function displayReceivedJson(data) {
    if (DOM.receivedJsonPreview) {
        DOM.receivedJsonPreview.textContent = JSON.stringify(data, null, 2);
    }
    if (DOM.receivedJsonContainer) {
        DOM.receivedJsonContainer.classList.remove('hidden');
    }
}

/**
 * Update status display in modals
 * @function updateStatus
 * @param {string} message - The status message to display
 * @param {string} [type='info'] - The type of status ('success', 'error', 'warning', 'info')
 * @returns {void}
 * @private
 * @todo Add more status types for better user feedback
 * @toimprove Implement auto-hiding of status messages after a delay
 * @tofix Ensure status messages are properly cleared when switching contexts
 */
function updateStatus(message, type = 'info') {
    const colorClass = {
        'success': 'text-green-600 dark:text-green-400',
        'error': 'text-red-600 dark:text-red-400',
        'warning': 'text-yellow-600 dark:text-yellow-400',
        'info': 'text-blue-600 dark:text-blue-400'
    }[type] || 'text-gray-600 dark:text-gray-400';

    if (DOM.shareStatus) {
        DOM.shareStatus.textContent = message;
        DOM.shareStatus.className = `text-sm ${colorClass}`;
    }
    if (DOM.downloadStatus) {
        DOM.downloadStatus.textContent = message;
        DOM.downloadStatus.className = `text-sm ${colorClass}`;
    }
}

/**
 * Start listening for incoming connections (Share mode)
 * @function startListening
 * @returns {void}
 * @todo Add notification when a connection is established
 * @toimprove Implement automatic timeout for listening mode
 * @tofix Ensure proper UI state management when starting/stopping listening
 */
export function startListening() {
    if (!peer) {
        showError('P2P system not initialized');
        return;
    }

    isListening = true;
    if (DOM.startReceivingBtn) {
        DOM.startReceivingBtn.classList.add('hidden');
    }
    if (DOM.stopReceivingBtn) {
        DOM.stopReceivingBtn.classList.remove('hidden');
    }
    updateStatus('Listening for connections...', 'info');
    showInfo('Share your code with the receiver');
}

/**
 * Stop listening for connections
 * @function stopListening
 * @returns {void}
 * @todo Add confirmation dialog before stopping listening
 * @toimprove Implement graceful disconnection from active connections
 * @tofix Ensure all UI elements are properly updated when stopping
 */
export function stopListening() {
    isListening = false;
    if (DOM.startReceivingBtn) {
        DOM.startReceivingBtn.classList.remove('hidden');
    }
    if (DOM.stopReceivingBtn) {
        DOM.stopReceivingBtn.classList.add('hidden');
    }
    if (currentConnection) {
        currentConnection.close();
        currentConnection = null;
    }
    updateStatus('Stopped listening', 'info');
}

/**
 * Connect to a peer and request data (Download mode)
 * @function connectToPeer
 * @param {string} targetId - The ID of the target peer to connect to
 * @returns {void}
 * @todo Add validation for peer ID format
 * @toimprove Implement connection timeout and retry logic
 * @tofix Handle edge cases when target peer is unavailable
 */
export function connectToPeer(targetId) {
    if (!peer) {
        showError('P2P system not initialized');
        return;
    }

    if (!targetId || targetId.length < 4) {
        showError('Please enter a valid peer code');
        return;
    }

    clearError();
    updateStatus('Connecting to peer...', 'info');

    const conn = peer.connect(targetId, {
        reliable: true
    });

    conn.on('open', () => {
        console.log('Connected to:', targetId);
        updateStatus('Connected! Requesting quiz...', 'success');
        
        // Send a request message (we could implement a handshake protocol)
        conn.send({ type: 'request' });
    });

    conn.on('data', (data) => {
        console.log('Download received data:', data);
        receivedData = data;
        
        if (validateQuizData(data)) {
            updateStatus('Quiz received!', 'success');
            displayReceivedJson(data);
            showSuccess('Quiz loaded! Check the preview below.');
        } else {
            updateStatus('Invalid quiz data received', 'error');
            showError('The received data is not a valid quiz');
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        let errorMsg = 'Failed to connect';
        if (err.type === 'peer-unavailable') {
            errorMsg = 'Peer not found. Make sure the code is correct and the sender is listening.';
        }
        updateStatus(errorMsg, 'error');
        showError(errorMsg);
    });

    conn.on('close', () => {
        console.log('Connection closed');
        if (DOM.downloadStatus.textContent.includes('Connecting') || 
            DOM.downloadStatus.textContent.includes('Requesting')) {
            updateStatus('Connection closed by peer', 'warning');
        }
    });
}

/**
 * Get the received quiz data
 * @function getReceivedData
 * @returns {any} The received data or null if none
 * @todo Add data validation before returning received data
 * @toimprove Implement data caching for better performance
 * @tofix Ensure data integrity when returning received data
 */
export function getReceivedData() {
    return receivedData;
}

/**
 * Clear received data after it's been used
 * @function clearReceivedData
 * @returns {void}
 * @todo Add confirmation before clearing important data
 * @toimprove Implement data backup before clearing
 * @tofix Ensure all related UI elements are updated after clearing
 */
export function clearReceivedData() {
    receivedData = null;
    if (DOM.receivedJsonPreview) {
        DOM.receivedJsonPreview.textContent = '';
    }
    if (DOM.receivedJsonContainer) {
        DOM.receivedJsonContainer.classList.add('hidden');
    }
}

/**
 * Destroy peer connection (cleanup)
 * @function destroyPeer
 * @returns {void}
 * @todo Add confirmation before destroying active connections
 * @toimprove Implement graceful shutdown of all connections
 * @tofix Ensure complete cleanup of all peer-related resources
 */
export function destroyPeer() {
    if (currentConnection) {
        currentConnection.close();
    }
    if (peer) {
        peer.destroy();
    }
    peer = null;
    currentConnection = null;
    isListening = false;
    receivedData = null;
}
