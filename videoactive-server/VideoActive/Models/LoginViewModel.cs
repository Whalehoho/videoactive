using System.ComponentModel.DataAnnotations;

namespace VideoActive.Models
{
    /** 
     * Represents the login data entered by a user for authentication.
     * This view model is used to capture the username and password for login purposes.
     */
    public class LoginViewModel
    {
        /** 
         * Gets or sets the username entered by the user during login.
         * This field is required for the authentication process.
         * 
         * @property {string} Username - The username of the user attempting to log in.
         * This is a required field, and validation is enforced via the Required attribute.
         */
        [Required]
        public string Username { get; set; }

        /** 
         * Gets or sets the password entered by the user during login.
         * This field is required for authentication, and the data is masked as a password input.
         * 
         * @property {string} Password - The password of the user attempting to log in.
         * This is a required field, and the input is validated as a password through the DataType attribute.
         */
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; }
    }
}

