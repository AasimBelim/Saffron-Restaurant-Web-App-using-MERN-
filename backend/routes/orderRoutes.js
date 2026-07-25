import express from "express";

import {adminOnly,protect} from "../middlewares/authMiddleware.js"
import { getAllOrders, getUserOrders, placeOrder, updateOrderStatus } from "../controllers/orderController.js";
const orderRoutes=express.Router();
orderRoutes.post("/place",protect,placeOrder);
orderRoutes.get("/my-orders",protect,getUserOrders);
orderRoutes.get("/orders",adminOnly,getAllOrders);
orderRoutes.put("/update-status/:orderId",adminOnly,updateOrderStatus);


export default orderRoutes;