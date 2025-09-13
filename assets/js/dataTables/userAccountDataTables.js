/**
 * User Account DataTables Configuration
 *
 * This file handles all DataTable functionality for user account management.
 * It depends on datatables-common.js for shared utilities and configurations.
 *
 * Dependencies:
 * - datatables-common.js (must be loaded before this file)
 * - jQuery
 * - DataTables library
 * - Bootstrap
 * - Toastr for notifications
 */

// Initialize User Account DataTable
const userAccountDataTable = new DataTable("#userAccountsTable", {
  ...DataTableDefaults.standard,
  ajax: {
    url: "app/API/apiUserAccount.php",
    type: "GET",
    data: (d) => {
      d.get_user_accounts = true;
      d.search = $("#searchInput").val().trim();
      d.status = $("#statusFilter").val() || "";
    },
    dataSrc: (json) =>
      handleAjaxSuccess(json, "Error loading user accounts data"),
    error: () =>
      handleAjaxError(
        null,
        "Error loading user accounts data. Please try again."
      ),
  },
  columns: [
    {
      data: null,
      render: (_, __, row) => {
        return `${row.FirstName} ${row.LastName}`;
      },
    },
    { data: "EmailAddress", render: DataTableRenderers.textStart },
    {
      data: "Permission",
      render: (data) => {
        const permissionMap = {
          0: '<span class="badge bg-primary">Admin</span>',
          1: '<span class="badge bg-info">Staff</span>',
        };
        return (
          permissionMap[data] ||
          '<span class="badge bg-secondary">Unknown</span>'
        );
      },
    },
    {
      data: "UserStatus",
      render: (data) => {
        const statusMap = {
          0: '<span class="badge bg-success">Active</span>',
          1: '<span class="badge bg-danger">Inactive</span>',
        };
        return (
          statusMap[data] || '<span class="badge bg-secondary">Unknown</span>'
        );
      },
    },
    {
      data: "DateRegistered",
      render: (data) => {
        if (!data) return "—";
        try {
          return moment.tz(data, "Asia/Manila").format("YYYY-MM-DD HH:mm:ss");
        } catch (e) {
          return data;
        }
      },
    },
    {
      data: null,
      render: (_, __, row) => {
        return `<button type="button" class="btn btn-outline-primary edit-user-account" 
                        data-user-account-id="${row.IdUserAccount}" title="Edit User Account">
                    <i class="bi bi-pen"></i>
                </button>`;
      },
    },
  ],
  order: [[4, "desc"]],
  language: {
    emptyTable: "No user accounts found matching your search criteria",
    info: "Showing _START_ to _END_ of _TOTAL_ user accounts",
    infoEmpty: "Showing 0 to 0 of 0 user accounts",
    infoFiltered: "(filtered from _MAX_ total user accounts)",
    lengthMenu: "Show _MENU_ user accounts per page",
    loadingRecords: "Loading...",
    processing: "Processing...",
    search: "Search:",
    zeroRecords: "No matching user accounts found",
  },
});

// Search functionality with debounce
let userAccountSearchTimeout;
function syncUserAccountClearBtn() {
  const hasText = $("#searchInput").val().trim().length > 0;
  if ($("#userClearSearchBtn").length) {
    $("#userClearSearchBtn").toggle(hasText);
  } else {
    $("#clearSearchBtn").toggleClass("d-none", !hasText);
  }
}
$("#searchInput").on("keyup", function () {
  clearTimeout(userAccountSearchTimeout);
  syncUserAccountClearBtn();
  userAccountSearchTimeout = setTimeout(() => {
    userAccountDataTable.ajax.reload();
  }, 500);
});

// Show clear only while focused
$("#searchInput").on("focus", function () {
  syncUserAccountClearBtn();
});
$("#searchInput").on("blur", function () {
  $("#clearSearchBtn").addClass("d-none");
});

// Clear search button
$(document).on("click", "#clearSearchBtn, #userClearSearchBtn", function () {
  $("#searchInput").val("");
  $("#clearSearchBtn").addClass("d-none");
  $("#userClearSearchBtn").hide();
  $("#searchInput").focus();
  userAccountDataTable.ajax.reload();
});

// Search button
$("#searchBtn").on("click", function () {
  userAccountDataTable.ajax.reload();
  syncUserAccountClearBtn();
});

// Status filter
$("#statusFilter").on("change", function () {
  userAccountDataTable.ajax.reload();
  syncUserAccountClearBtn();
});

// Save user account button
$("#saveUserAccountBtn").on("click", function () {
  createUserAccount();
});

// Update user account button
$("#updateUserAccountBtn").on("click", function () {
  updateUserAccount();
});

// Action button handler
$(document).on("click", ".edit-user-account", function () {
  const userAccountId = $(this).data("user-account-id");
  editUserAccount(userAccountId);
});

// Action function
function editUserAccount(userAccountId) {
  // Load user account data for editing
  $.ajax({
    url: "app/API/apiUserAccount.php",
    type: "GET",
    data: {
      get_user_account: true,
      id: userAccountId,
    },
    success: function (response) {
      if (response.status === 1) {
        const userAccount = response.data;

        // Populate edit modal with user account data
        $("#editUserAccountId").val(userAccount.IdUserAccount);
        $("#editFirstName").val(userAccount.FirstName);
        $("#editLastName").val(userAccount.LastName);
        $("#editEmailAddress").val(userAccount.EmailAddress);
        $("#editPermission").val(userAccount.Permission);
        $("#editUserStatus").val(userAccount.UserStatus);

        // Clear password fields for security
        $("#editTempPass").val("");
        $("#editPermPass").val("");

        // Store original values for change detection
        const $form = $("#editUserAccountForm");
        $form.data("original", {
          FirstName: String(userAccount.FirstName || ""),
          LastName: String(userAccount.LastName || ""),
          EmailAddress: String(userAccount.EmailAddress || ""),
          Permission: String(userAccount.Permission ?? ""),
          UserStatus: String(userAccount.UserStatus ?? ""),
        });

        // Disable Update button initially
        $("#updateUserAccountBtn").prop("disabled", true);

        // Setup change detection handlers (once)
        if (!$form.data("listenersAttached")) {
          const onEditChange = () => {
            const orig = $form.data("original") || {};
            const changed =
              $("#editFirstName").val().trim() !== (orig.FirstName || "") ||
              $("#editLastName").val().trim() !== (orig.LastName || "") ||
              $("#editEmailAddress").val().trim() !==
                (orig.EmailAddress || "") ||
              String($("#editPermission").val() ?? "") !==
                (orig.Permission || "") ||
              String($("#editUserStatus").val() ?? "") !==
                (orig.UserStatus || "") ||
              $("#editTempPass").val().trim().length > 0 ||
              $("#editPermPass").val().trim().length > 0;
            $("#updateUserAccountBtn").prop("disabled", !changed);
          };
          $form.on("input change", "input, select", onEditChange);
          // Mark listeners attached
          $form.data("listenersAttached", true);
        }

        // Show edit modal
        $("#editUserAccountModal").modal("show");
      } else {
        toastr.error("Error loading user account: " + response.message);
      }
    },
    error: function () {
      toastr.error("Error loading user account data");
    },
  });
}

// Create user account
function createUserAccount() {
  const formEl = $("#createUserAccountForm")[0];
  if (!formEl.checkValidity()) {
    formEl.reportValidity();
    return;
  }
  const formData = new FormData(formEl);
  formData.append("create_user_account", true);

  $.ajax({
    url: "app/API/apiUserAccount.php",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      if (response.status === 1) {
        toastr.success("User account created successfully!");
        $("#createUserAccountModal").modal("hide");
        $("#createUserAccountForm")[0].reset();
        userAccountDataTable.ajax.reload();
      } else {
        toastr.error("Error creating user account: " + response.message);
      }
    },
    error: function () {
      toastr.error("Error creating user account");
    },
  });
}

// Update user account
function updateUserAccount() {
  const $form = $("#editUserAccountForm");
  const formEl = $form[0];
  // Guard: prevent submit when nothing changed
  const orig = $form.data("original") || {};
  const noChanges =
    $("#editFirstName").val().trim() === (orig.FirstName || "") &&
    $("#editLastName").val().trim() === (orig.LastName || "") &&
    $("#editEmailAddress").val().trim() === (orig.EmailAddress || "") &&
    String($("#editPermission").val() ?? "") === (orig.Permission || "") &&
    String($("#editUserStatus").val() ?? "") === (orig.UserStatus || "") &&
    $("#editTempPass").val().trim().length === 0 &&
    $("#editPermPass").val().trim().length === 0;
  if (noChanges) {
    toastr.info("No changes to update.");
    return;
  }
  if (!formEl.checkValidity()) {
    formEl.reportValidity();
    return;
  }
  const formData = new FormData(formEl);
  formData.append("update_user_account", true);

  $.ajax({
    url: "app/API/apiUserAccount.php",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (response) {
      if (response.status === 1) {
        toastr.success("User account updated successfully!");
        $("#editUserAccountModal").modal("hide");
        $("#editUserAccountForm")[0].reset();
        $form.removeData("original");
        $("#updateUserAccountBtn").prop("disabled", true);
        userAccountDataTable.ajax.reload();
      } else {
        toastr.error("Error updating user account: " + response.message);
      }
    },
    error: function () {
      toastr.error("Error updating user account");
    },
  });
}

// Export functions for global access
window.userAccountDataTable = userAccountDataTable;
window.editUserAccount = editUserAccount;
window.createUserAccount = createUserAccount;
window.updateUserAccount = updateUserAccount;
