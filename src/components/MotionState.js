// components/MotionState.js
import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { FaShieldAlt } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, query, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';

export default function MotionState() {
  const [motionState, setMotionState] = useState(null);

 // Listen to motion state
useEffect(() => {
  const docRef = doc(db, "sensorData", "latest");

  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data?.mpu6050?.motionState) {
        setMotionState(data.mpu6050.motionState);
      }
    }
  });

  return () => unsubscribe();
}, []);

  if (!motionState) return null;

  const chartData = {
    labels: ['Stable', 'Moving', 'Shaking'],
    datasets: [{
      data: [
        motionState === 'stable' ? 1 : 0,
        motionState === 'moving' ? 1 : 0,
        motionState === 'shaking' ? 1 : 0
      ],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(255, 99, 132, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>
          <FaShieldAlt className="me-2" />
          Motion State
        </Card.Title>
        <div style={{ height: '250px' }}>
          <Pie 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right' }
              }
            }}
          />
        </div>
        <div className="text-center mt-3">
          <Badge bg="success" className="me-2">
            Stable: {motionState === 'stable' ? 'Yes' : 'No'}
          </Badge>
          <Badge bg="warning" className="me-2">
            Moving: {motionState === 'moving' ? 'Yes' : 'No'}
          </Badge>
          <Badge bg="danger">
            Shaking: {motionState === 'shaking' ? 'Yes' : 'No'}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}
