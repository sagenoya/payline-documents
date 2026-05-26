import { UserModule } from './modules/user';
import { DmsModule } from './modules/dms';

/**
 * API Singleton
 * All API interactions should be done through this instance.
 * Example: const { data } = await $api.user.getMe();
 */
class ApiRepository {
  public readonly user = new UserModule();
  public readonly dms = new DmsModule();
  
  // Add other modules here:
  // public readonly auth = new AuthModule();
  // public readonly properties = new PropertyModule();
}

export const $api = new ApiRepository();
