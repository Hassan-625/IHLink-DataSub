import type {ReactNode} from 'react';
import {Navigate} from 'react-router-dom';
import {useDataSubPermissions,type DataSubPermission} from '@/hooks/useDataSubPermissions';
export function DataSubPermissionGate({permission,children}:{permission:DataSubPermission;children:ReactNode}){const {can,loading}=useDataSubPermissions();if(loading)return <div className="p-8 text-center" role="status">Checking your account…</div>;return can(permission)?<>{children}</>:<Navigate to="/datasub/access-denied" replace/>;}
