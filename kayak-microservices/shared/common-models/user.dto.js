/**
 * User Data Transfer Object
 */

class UserDTO {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.phone = data.phone;
    this.createdAt = data.createdAt;
  }

  // Exclude sensitive data
  toPublic() {
    return {
      id: this.id,
      name: this.name
    };
  }
}

module.exports = UserDTO;

