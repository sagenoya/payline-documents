import { FetchFactory } from '../factory';
import { ApiResponse, User } from '@/types/api';

export class UserModule extends FetchFactory {
  private readonly RESOURCE = '/users';

  /**
   * Get the current authenticated user's profile
   */
  async getMe(): Promise<ApiResponse<User>> {
    return this.call<ApiResponse<User>>('GET', `${this.RESOURCE}/me`);
  }

  /**
   * Update the user's profile information
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.call<ApiResponse<User>>('PATCH', `${this.RESOURCE}/profile`, { body: data });
  }

  /**
   * Upload a profile picture
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.call<ApiResponse<{ avatarUrl: string }>>('POST', `${this.RESOURCE}/avatar`, { body: formData });
  }
}
