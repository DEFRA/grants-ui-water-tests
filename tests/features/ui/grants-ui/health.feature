@api @grants-ui @health @dev
Feature: Grants UI - Health Checks

  Background: Ensure the grants UI application is running
    Given the Grants UI application is running

  Scenario: Check the health of the grants UI application
    When I check the health endpoint
    Then I should receive a healthy response