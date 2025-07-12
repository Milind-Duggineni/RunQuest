// src/services/navigation.ts

// src/services/navigation.ts
import * as React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as never, params as never);
}

export function goBack() {
  navigationRef.current?.goBack();
}