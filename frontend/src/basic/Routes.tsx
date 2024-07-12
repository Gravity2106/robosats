import React, { useContext, useEffect } from 'react';
import { Routes as DomRoutes, Route, useNavigate } from 'react-router-dom';
import { Box, Slide, Typography, styled } from '@mui/material';
import { type UseAppStoreType, AppContext } from '../contexts/AppContext';

import { RobotPage, MakerPage, BookPage, OrderPage, SettingsPage } from '.';
import { GarageContext, UseGarageStoreType } from '../contexts/GarageContext';

const Routes: React.FC = () => {
  const navigate = useNavigate();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { page, slideDirection } = useContext<UseAppStoreType>(AppContext);

  useEffect(() => {
    window.addEventListener('navigateToPage', (event) => {
      const orderId = event?.detail?.order_id;
      const coordinator = event?.detail?.coordinator;
      if (orderId && coordinator) {
        const slot = garage.getSlotByOrder(coordinator, orderId);
        if (slot?.token) {
          garage.setCurrentSlot(slot?.token);
          navigate(`/order/${coordinator}/${orderId}`);
        }
      }
    });
  }, []);

  return (
    <DomRoutes>
      {['/robot/:token?', '/', ''].map((path, index) => {
        return (
          <Route
            path={path}
            element={
              <Slide
                direction={page === 'robot' ? slideDirection.in : slideDirection.out}
                in={page === 'robot'}
                appear={slideDirection.in !== undefined}
              >
                <div>
                  <RobotPage />
                </div>
              </Slide>
            }
            key={index}
          />
        );
      })}

      <Route
        path={'/offers'}
        element={
          <Slide
            direction={page === 'offers' ? slideDirection.in : slideDirection.out}
            in={page === 'offers'}
            appear={slideDirection.in !== undefined}
          >
            <div>
              <BookPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/create'
        element={
          <Slide
            direction={page === 'create' ? slideDirection.in : slideDirection.out}
            in={page === 'create'}
            appear={slideDirection.in !== undefined}
          >
            <div>
              <MakerPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/order/:shortAlias/:orderId'
        element={
          <Slide
            direction={page === 'order' ? slideDirection.in : slideDirection.out}
            in={page === 'order'}
            appear={slideDirection.in !== undefined}
          >
            <div>
              <OrderPage />
            </div>
          </Slide>
        }
      />

      <Route
        path='/settings'
        element={
          <Slide
            direction={page === 'settings' ? slideDirection.in : slideDirection.out}
            in={page === 'settings'}
            appear={slideDirection.in !== undefined}
          >
            <div>
              <SettingsPage />
            </div>
          </Slide>
        }
      />
    </DomRoutes>
  );
};

export default Routes;
