import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private UserModel: Model<UserDocument>) {
    //
  }

  compareObjects(first: any, second: any) {
    if (first === second) return true;
    if (first === null || second === null) return false;
    if (typeof first !== 'object' || typeof second !== 'object') return false;
    const first_keys = Object.getOwnPropertyNames(first);
    const second_keys = Object.getOwnPropertyNames(second);
    if (first_keys.length !== second_keys.length) return false;
    for (const key of first_keys) {
      if (!Object.hasOwn(second, key)) return false;
      if (this.compareObjects(first[key], second[key]) === false) return false;
    }
    return true;
  }

  getUserDetails(data: any): UserDocument {
    const keysToExtract = [
      'name',
      'picture',
      'email',
      'email_verified',
      'given_name',
      'family_name',
      'provider',
    ];
    const extractedData = keysToExtract.reduce((obj, key) => {
      if (key in data) obj[key] = data[key];
      return obj;
    }, {});
    return extractedData as UserDocument;
  }

  async findOneByQuery(
    findQuery: FilterQuery<UserDocument>,
  ): Promise<UserDocument> {
    const user = await this.UserModel.findOne(findQuery).lean();
    if (!user) {
      throw new BadRequestException('User not registered.');
    }
    return user as UserDocument;
  }

  async findOneById(userId: string): Promise<UserDocument> {
    const userObjectId = new ObjectId(userId);
    const user = await this.UserModel.findById(userObjectId).lean();
    if (!user) {
      throw new BadRequestException('User not registered.');
    }
    return user as UserDocument;
  }

  async validateUser(userDetails: UserDocument): Promise<UserDocument> {
    const { email } = userDetails || {};
    const user = await this.UserModel.findOne({
      email,
    }).lean();
    if (!user) {
      const newUser = new this.UserModel(userDetails);
      const savedUser = (await newUser.save()).toObject();
      return savedUser;
    }
    const { _id, createdAt, updatedAt, __v, ...restUser } = user || {};
    const extractedData = this.getUserDetails(userDetails);
    const areEqual = this.compareObjects(extractedData, restUser);
    if (!areEqual) {
      const updatedUser = await this.UserModel.findByIdAndUpdate(
        _id,
        { $set: userDetails },
        { upsert: true, new: true },
      ).lean();
      return updatedUser as UserDocument;
    }
    return user as UserDocument;
  }
}
