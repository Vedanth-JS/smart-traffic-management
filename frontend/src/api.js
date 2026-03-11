import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL);

export const getIntersections = () => axios.get(`${API_BASE}/intersections`);
export const updateSignal = (data) => axios.post(`${API_BASE}/signal-update`, data);
export const getStats = () => axios.get(`${API_BASE}/traffic-stats`);
