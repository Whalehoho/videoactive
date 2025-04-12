using System.ComponentModel.DataAnnotations;

namespace VideoActive.Models
{
    /** 
     * Represents the view model for changing a user's password.
     * This model is used to validate and capture the necessary data for updating the user's password.
     */
    public class ChangePasswordViewModel
    {
        /** 
         * Gets or sets the current password of the user.
         * This field is required for authentication to ensure the user is authorized to change their password.
         * 
         * @property {string} CurrentPassword - The current password of the user.
         * This value must be entered by the user to confirm their identity.
         */
        [Required]
        [DataType(DataType.Password)]
        public string CurrentPassword { get; set; }

        /** 
         * Gets or sets the new password the user wishes to set.
         * This field is required and must meet a minimum length of 6 characters. 
         * An error message is shown if the new password does not meet the length requirement.
         * 
         * @property {string} NewPassword - The new password the user wants to set.
         * This value must be at least 6 characters long.
         */
        [Required]
        [DataType(DataType.Password)]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters long.")]
        public string NewPassword { get; set; }

        /** 
         * Gets or sets the confirmation password to match the new password.
         * This field is required and must match the `NewPassword` field to confirm the user's intent.
         * An error message is shown if the passwords do not match.
         * 
         * @property {string} ConfirmPassword - The confirmation of the new password.
         * This value must match the `NewPassword` field to ensure both values are the same.
         */
        [Required]
        [DataType(DataType.Password)]
        [Compare("NewPassword", ErrorMessage = "New password and confirmation do not match.")]
        public string ConfirmPassword { get; set; }
    }
}
