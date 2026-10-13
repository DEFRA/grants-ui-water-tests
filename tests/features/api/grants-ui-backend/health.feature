@api @grants-ui-backend @health @dev
Feature: Grants UI Backend - Health Checks

  Background: Ensure the grants UI backend application is running
    Given the Grants UI Backend application is running

  Scenario: Check the health of the grants UI backend application
    When I check the health endpoint
    Then I should receive a healthy response