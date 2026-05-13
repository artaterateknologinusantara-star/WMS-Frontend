'use client';

import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { InboundFormData } from './InboundReceivingContent';

interface GeneralInfoFormProps {
  register: UseFormRegister<InboundFormData>;
  errors: FieldErrors<InboundFormData>;
}

export default function GeneralInfoForm({ register, errors }: GeneralInfoFormProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-foreground mb-5">General Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label" htmlFor="supplierName">Supplier Name</label>
          <input
            id="supplierName"
            type="text"
            placeholder="Enter supplier name"
            className="form-input"
            {...register('supplierName', { required: 'Supplier name is required' })}
          />
          {errors.supplierName && (
            <p className="text-xs text-danger mt-1">{errors.supplierName.message}</p>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="driverName">Driver Name</label>
          <input
            id="driverName"
            type="text"
            placeholder="Enter driver name"
            className="form-input"
            {...register('driverName', { required: 'Driver name is required' })}
          />
          {errors.driverName && (
            <p className="text-xs text-danger mt-1">{errors.driverName.message}</p>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="vehicleNumber">Vehicle Number</label>
          <input
            id="vehicleNumber"
            type="text"
            placeholder="Enter vehicle number"
            className="form-input"
            {...register('vehicleNumber', { required: 'Vehicle number is required' })}
          />
          {errors.vehicleNumber && (
            <p className="text-xs text-danger mt-1">{errors.vehicleNumber.message}</p>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="poNumber">PO Number</label>
          <input
            id="poNumber"
            type="text"
            placeholder="Enter PO number"
            className="form-input"
            {...register('poNumber', { required: 'PO number is required' })}
          />
          {errors.poNumber && (
            <p className="text-xs text-danger mt-1">{errors.poNumber.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}