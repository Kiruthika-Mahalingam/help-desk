import { Request, Response, NextFunction } from 'express';
export interface CustomError extends Error {
    statusCode?: number;
}
export declare const errorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number) => CustomError;
//# sourceMappingURL=errorHandler.d.ts.map