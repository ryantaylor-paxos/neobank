import { useAppStore } from '@/lib/store';

// Reset the store between tests
beforeEach(() => {
  useAppStore.setState({ user: null });
});

const mockUser = {
  identity_id: 'id_123',
  profile_id: 'prof_456',
  account_id: 'acc_789',
  first_name: 'Jane',
  last_name: 'Smith',
};

describe('useAppStore', () => {
  describe('initial state', () => {
    it('starts with no user', () => {
      expect(useAppStore.getState().user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('sets the user', () => {
      useAppStore.getState().setUser(mockUser);
      expect(useAppStore.getState().user).toEqual(mockUser);
    });

    it('stores all user fields', () => {
      useAppStore.getState().setUser(mockUser);
      const { user } = useAppStore.getState();
      expect(user?.identity_id).toBe('id_123');
      expect(user?.profile_id).toBe('prof_456');
      expect(user?.account_id).toBe('acc_789');
      expect(user?.first_name).toBe('Jane');
      expect(user?.last_name).toBe('Smith');
    });

    it('replaces an existing user', () => {
      useAppStore.getState().setUser(mockUser);
      const newUser = { ...mockUser, first_name: 'Bob', profile_id: 'prof_999' };
      useAppStore.getState().setUser(newUser);
      expect(useAppStore.getState().user?.first_name).toBe('Bob');
      expect(useAppStore.getState().user?.profile_id).toBe('prof_999');
    });
  });

  describe('clearUser', () => {
    it('clears the user', () => {
      useAppStore.getState().setUser(mockUser);
      useAppStore.getState().clearUser();
      expect(useAppStore.getState().user).toBeNull();
    });

    it('is safe to call when already null', () => {
      expect(() => useAppStore.getState().clearUser()).not.toThrow();
      expect(useAppStore.getState().user).toBeNull();
    });
  });
});
