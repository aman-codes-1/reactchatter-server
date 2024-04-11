import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {
    //
  }

  async login(ticketData: User): Promise<User> {
    const { email } = ticketData || {};
    const user = await this.UserModel.findOne({ email }).lean();
    if (!user) {
      const newUser = new this.UserModel({ ...ticketData });
      const savedUser = await newUser.save();
      return savedUser.toObject();
    }
    const { _id, __v, ...rest } = (user as any) || {};
    let objEqual = false;
    const obj1Keys = Object.keys(rest).sort();
    const obj2Keys = Object.keys(ticketData).sort();
    const areEqual = obj1Keys.every((key, index) => {
      const objValue1 = rest[key];
      const objValue2 = ticketData[obj2Keys[index]];
      return objValue1 === objValue2;
    });
    if (areEqual) {
      objEqual = true;
    } else {
      objEqual = false;
    }
    if (!objEqual) {
      const updatedUser = await this.UserModel.findByIdAndUpdate(
        { _id },
        { $set: ticketData },
        { upsert: true, new: true },
      ).lean();
      return updatedUser;
    }
    return user;
  }
}
